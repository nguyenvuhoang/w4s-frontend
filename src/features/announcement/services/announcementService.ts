import { cdnServiceApi } from "@/servers/cnd-service";
import { workflowService } from "@/servers/system-service";
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10
import type {
  AnnouncementFilterModel,
  AnnouncementAttachmentItem,
  AnnouncementDetailItem,
  AnnouncementHierarchyFields,
  AnnouncementInitialData,
  AnnouncementItem,
  AnnouncementOption,
  AnnouncementSearchRequest,
  AnnouncementSearchResponse,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from "../types";
import { AnnouncementWorkflowError as AnnouncementSearchWorkflowError } from "../types";

type ServiceOptions = {
  sessiontoken?: string;
  language?: string;
};

const LOAD_ANNOUNCEMENT_CONFIG_WORKFLOW_ID = "WF_BO_ANNOUNCEMENT_CONFIG";
const LOAD_PROJECT_HIERARCHY_WORKFLOW_ID = "WF_BO_GET_PROJECT_HIERARCHY";
const CREATE_ANNOUNCEMENT_WORKFLOW_ID = "WF_BO_CREATE_ANNOUNCEMENT";
const UPDATE_ANNOUNCEMENT_WORKFLOW_ID = "WF_BO_UPDATE_ANNOUNCEMENT";
export const SEARCH_ANNOUNCEMENTS_WORKFLOW_ID = "WF_BO_SIMPLE_SEARCH_ANNOUNCEMENTS";
export const ADVANCED_SEARCH_ANNOUNCEMENT = "WF_BO_ADVANCED_SEARCH_ANNOUNCEMENT";
export const GET_ANNOUNCEMENT_WORKFLOW_ID = "WF_BO_GET_ANNOUNCEMENT";

const getCurrentUpdateDate = () => new Date().toISOString();

const fallback_initial_data: AnnouncementInitialData = {
  // TODO: Replace fallback with codelist/workflow response once IPS announcement config is available.
  notification_types: [
    { label: "Announcement", value: "ANNOUNCEMENT" },
    { label: "News", value: "NEWS" },
  ],
  projects: [],
  towers: [],
  floors: [],
  units: [],
  apartment_types: [],
};

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const objectValue = value as Record<string, any>;

  return asArray(
    objectValue.items ??
      objectValue.data ??
      objectValue.input?.items ??
      objectValue.input?.data,
  );
};

const pick = (item: any, keys: string[]) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }

  return undefined;
};

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, "");

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== "object") return undefined;

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }

  const normalized = Object.keys(item).reduce<Record<string, any>>(
    (values, key) => {
      values[normalizeKey(key)] = item[key];

      return values;
    },
    {},
  );

  for (const key of keys) {
    const value = normalized[normalizeKey(key)];

    if (value !== undefined && value !== null) return value;
  }

  return undefined;
};

const toNumber = (value: unknown) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toNumberWithFallback = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toBoolean = (value: unknown) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true" ||
  value === "T" ||
  value === "Y";

const toNullableString = (value: unknown) => {
  if (value === null || value === undefined) return "";

  return String(value).trim();
};

const getResponseData = (response: any) => {
  const data = response?.payload?.dataresponse?.data;

  return data?.data ?? data?.input?.data ?? data?.input ?? data ?? {};
};

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.input?.items)) return root.input.items;

  return [];
};

const mapOptions = (
  items: unknown,
  valueKeys: string[],
  labelKeys: string[],
): AnnouncementOption[] => {
  const seen = new Set<string>();

  return asArray(items)
    .map((item) => {
      const value = String(pick(item, valueKeys) ?? "").trim();
      const label = String(pick(item, labelKeys) ?? value).trim();

      return { value, label, raw: item };
    })
    .filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);

      return true;
    });
};

const uniqueOptions = (items: AnnouncementOption[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.value || seen.has(item.value)) return false;
    seen.add(item.value);

    return true;
  });
};

const mapAnnouncementConfig = (
  response: any,
): Pick<AnnouncementInitialData, "notification_types"> => {
  const data = getResponseData(response);

  return {
    notification_types: mapOptions(
      data.notification_types ?? data.notificationTypes ?? data.types,
      ["value", "code", "type_code", "typeCode", "id"],
      ["label", "name", "type_name", "typeName", "description"],
    ),
  };
};

const getProjects = (value: any): any[] => {
  const data = getResponseData(value);

  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data)) return data;

  return asArray(data.projects ?? data);
};

const mapProjectHierarchy = (
  response: any,
): Omit<AnnouncementInitialData, "notification_types"> => {
  const projects = getProjects(response);
  const projectOptions: AnnouncementOption[] = [];
  const towerOptions: AnnouncementOption[] = [];
  const floorOptions: AnnouncementOption[] = [];
  const unitOptions: AnnouncementOption[] = [];
  const apartmentTypeOptions: AnnouncementOption[] = [];

  for (const project of projects) {
    const projectId = toNumber(
      pick(project, ["id", "project_id", "projectId"]),
    );
    const projectCode = String(
      pick(project, ["project_code", "projectCode", "code"]) ?? "",
    ).trim();
    const projectLabel = String(
      pick(project, ["name", "project_name", "projectName", "label"]) ??
        projectCode ??
        projectId ??
        "",
    ).trim();

    if (projectId !== undefined || projectCode) {
      projectOptions.push({
        value: String(projectId ?? projectCode),
        label: projectLabel || String(projectId ?? projectCode),
        id: projectId,
        code: projectCode,
        project_id: projectId,
        raw: project,
      });
    }

    for (const building of asArray(project.buildings ?? project.towers)) {
      const buildingId = toNumber(
        pick(building, ["id", "building_id", "buildingId"]),
      );
      const buildingCode = String(
        pick(building, [
          "building_code",
          "buildingCode",
          "tower_code",
          "towerCode",
          "code",
        ]) ?? "",
      ).trim();
      const buildingLabel = String(
        pick(building, [
          "name",
          "building_name",
          "buildingName",
          "tower_name",
          "towerName",
          "label",
        ]) ??
          buildingCode ??
          buildingId ??
          "",
      ).trim();

      if (buildingId !== undefined || buildingCode) {
        towerOptions.push({
          value: String(buildingId ?? buildingCode),
          label: buildingLabel || String(buildingId ?? buildingCode),
          id: buildingId,
          code: buildingCode,
          project_id: projectId,
          building_id: buildingId,
          raw: building,
        });
      }

      for (const floor of asArray(building.floors)) {
        const floorId = toNumber(pick(floor, ["id", "floor_id", "floorId"]));
        const floorCode = String(
          pick(floor, ["floor_code", "floorCode", "code"]) ?? "",
        ).trim();
        const floorFallback = pick(floor, ["floor", "floor_no", "floorNo"]);
        const floorLabel = String(
          pick(floor, ["name", "floor_name", "floorName", "label"]) ??
            floorFallback ??
            floorCode ??
            floorId ??
            "",
        ).trim();

        if (floorId !== undefined || floorCode) {
          floorOptions.push({
            value: String(floorId ?? floorCode),
            label: floorLabel || String(floorId ?? floorCode),
            id: floorId,
            code: floorCode,
            project_id: projectId,
            building_id: buildingId,
            floor_id: floorId,
            raw: floor,
          });
        }

        for (const apartment of asArray(floor.apartments ?? floor.units)) {
          const apartmentId = toNumber(
            pick(apartment, ["id", "apartment_id", "apartmentId"]),
          );
          const apartmentCode = String(
            pick(apartment, [
              "apartment_code",
              "apartmentCode",
              "unit_code",
              "unitCode",
              "code",
            ]) ?? "",
          ).trim();
          const unitNumber = String(
            pick(apartment, ["unit_number", "unitNumber"]) ?? "",
          ).trim();
          const apartmentType = String(
            pick(apartment, ["apartment_type", "apartmentType"]) ?? "",
          ).trim();
          const ownerName = toNullableString(
            pick(apartment, [
              "owner_name",
              "ownerName",
              "householder_name",
              "householderName",
              "head_of_household_name",
              "headOfHouseholdName",
              "primary_resident_name",
              "primaryResidentName",
            ]),
          );

          if (apartmentId !== undefined || apartmentCode) {
            unitOptions.push({
              value: String(apartmentId ?? apartmentCode),
              label: apartmentCode || unitNumber || String(apartmentId ?? ""),
              id: apartmentId,
              code: apartmentCode,
              project_id: projectId,
              building_id: buildingId,
              floor_id: floorId,
              apartment_id: apartmentId,
              apartment_type: apartmentType,
              apartment_code: apartmentCode,
              owner_name: ownerName,
              head_of_household_name: ownerName,
              raw: apartment,
            });
          }

          if (apartmentType) {
            apartmentTypeOptions.push({
              value: apartmentType,
              label: apartmentType,
              apartment_type: apartmentType,
              project_id: projectId,
              building_id: buildingId,
              floor_id: floorId,
              apartment_id: apartmentId,
              raw: apartment,
            });
          }
        }
      }
    }
  }

  return {
    projects: uniqueOptions(projectOptions),
    towers: uniqueOptions(towerOptions),
    floors: uniqueOptions(floorOptions),
    units: uniqueOptions(unitOptions),
    apartment_types: uniqueOptions(apartmentTypeOptions),
  };
};

const hasErrors = (response: any) => {
  const errors =
    response?.payload?.dataresponse?.errors ??
    response?.payload?.dataresponse?.error;

  return Array.isArray(errors) && errors.length > 0;
};

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse =
    response?.payload?.dataresponse ?? response?.dataresponse;
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data;
  const errors = dataresponse?.errors ?? response?.errors;
  const failed =
    response?.success === false ||
    dataresponse?.success === false ||
    data?.success === false ||
    dataresponse?.code === "failed" ||
    data?.code === "failed";

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    const error = Array.isArray(errors) ? (errors[0] ?? {}) : {};
    const message =
      error.info ??
      error.message ??
      error.description ??
      dataresponse?.message ??
      fallback;

    throw new AnnouncementSearchWorkflowError(
      message,
      error.next_action ?? dataresponse?.next_action,
    );
  }
};

const normalizeResponsePage = (
    value: unknown,
    requestPageIndex: number
) => Math.max(
    toNumberWithFallback(value, requestPageIndex),
    0
)

export const mapAnnouncement = (item: any): AnnouncementItem => ({
  id: toNumberWithFallback(getField(item, ["id", "announcement_id"])),
  project_id: toNumberWithFallback(getField(item, ["project_id"])),
  project_code: String(getField(item, ["project_code"]) ?? ""),
  title: String(getField(item, ["title"]) ?? ""),
  summary: String(getField(item, ["summary"]) ?? ""),
  category: String(getField(item, ["category"]) ?? ""),
  status: String(getField(item, ["status"]) ?? ""),
  published_on_utc: String(
    getField(item, ["published_on_utc", "published_on"]) ?? "",
  ),
  is_pinned: toBoolean(getField(item, ["is_pinned"])),
  require_read_confirmation: toBoolean(
    getField(item, ["require_read_confirmation"]),
  ),
});

export type CreateAnnouncementResult = {
  id: number;
  title: string;
  status: string;
  published_on_utc: string;
};

export const mapCreateAnnouncementResponse = (
  response: any,
): CreateAnnouncementResult => {
  const data = getResponseData(response);

  return {
    id: toNumberWithFallback(getField(data, ["id"])),
    title: String(getField(data, ["title"]) ?? ""),
    status: String(getField(data, ["status"]) ?? ""),
    published_on_utc: String(
      getField(data, ["published_on_utc", "published_on"]) ?? "",
    ),
  };
};

const mapAttachment = (item: any): AnnouncementAttachmentItem => ({
  id: toNumberWithFallback(getField(item, ["id"])),
  announcement_id: toNumberWithFallback(getField(item, ["announcement_id"])),
  file_name: String(getField(item, ["file_name", "name"]) ?? ""),
  file_url: String(getField(item, ["file_url", "url"]) ?? ""),
  file_type: String(getField(item, ["file_type", "type"]) ?? ""),
  file_size: toNumberWithFallback(getField(item, ["file_size", "size"])),
  display_order: toNumberWithFallback(getField(item, ["display_order"])),
});

const mapAnnouncementDetail = (response: any): AnnouncementDetailItem => {
  const root = getResponseData(response);
  const item = root?.announcement ?? root?.item ?? pickItems(root)[0] ?? root;
  const translations = getField(item, ["translations", "i18n"]);

  return {
    ...mapAnnouncement(item),
    content: String(getField(item, ["content", "content_html"]) ?? ""),
    target_audience: getField(item, ["target_audience"]) ?? null,
    published_by_user_code: String(
      getField(item, ["published_by_user_code"]) ?? "",
    ),
    attachments: pickItems(item?.attachments).map(mapAttachment),
    translations:
      translations && typeof translations === "object"
        ? translations
        : undefined,
  };
};

export const mapAnnouncementsSearchResponse = (
  response: any,
  request: AnnouncementSearchRequest,
): AnnouncementSearchResponse => {
  const root = getResponseData(response);
  const total_count = toNumberWithFallback(
    getField(root, ["total_count", "total_items"]),
  );
  const page_size = toNumberWithFallback(
    getField(root, ["page_size"]),
    request.page_size,
  );
  const total_pages = toNumberWithFallback(
    getField(root, ["total_pages"]),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0,
  );

  return {
    items: pickItems(root).map(mapAnnouncement),
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ["has_previous_page"])),
    has_next_page: toBoolean(getField(root, ["has_next_page"])),
    page_index: normalizeResponsePage(
      getField(root, ["page_index"]),
      request.page_index,
    ),
    page_size,
  };
};

export const announcementService = {
  getDefaultSearchResponse: (
    filter?: Partial<AnnouncementFilterModel>,
  ): AnnouncementSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
    page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE,
  }),

  async simpleSearchAnnouncements({
    sessiontoken,
    language,
    filter,
  }: ServiceOptions & {
    filter: AnnouncementFilterModel;
  }): Promise<AnnouncementSearchResponse> {
    if (!sessiontoken) return this.getDefaultSearchResponse(filter);
    if (!Number.isInteger(filter.project_id) || filter.project_id <= 0)
      return this.getDefaultSearchResponse(filter);

    const request: AnnouncementSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index, 0),
      search_text: filter.search_text.trim(),
      project_id: Number(filter.project_id),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: ADVANCED_SEARCH_ANNOUNCEMENT,
      input: request,
      language: language as any,
    });

    assertWorkflowSuccess(response, "Unable to load announcements.");

    return mapAnnouncementsSearchResponse(response, request);
  },

  async getAnnouncementById({
    sessiontoken,
    language,
    id,
  }: ServiceOptions & { id: number }): Promise<AnnouncementDetailItem> {
    if (!sessiontoken)
      throw new AnnouncementSearchWorkflowError(
        "Session is required.",
        "logout",
      );

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: GET_ANNOUNCEMENT_WORKFLOW_ID,
      input: { id },
      language: language as any,
    });

    assertWorkflowSuccess(response, "Unable to load announcement detail.");

    return mapAnnouncementDetail(response);
  },

  async loadProjectHierarchy(
    fields: AnnouncementHierarchyFields = {},
    options: ServiceOptions = {},
  ) {
    const response = await workflowService.runFODynamic({
      sessiontoken: options.sessiontoken as string,
      workflowid: LOAD_PROJECT_HIERARCHY_WORKFLOW_ID,
      input: fields,
      language: options.language as any,
    });

    if (
      response.status < 200 ||
      response.status >= 300 ||
      hasErrors(response)
    ) {
      return {
        projects: [],
        towers: [],
        floors: [],
        units: [],
        apartment_types: [],
      };
    }

    return mapProjectHierarchy(response);
  },

  async loadInitialData(
    options: ServiceOptions = {},
  ): Promise<AnnouncementInitialData> {
    const hierarchy = await this.loadProjectHierarchy({}, options);

    try {
      const response = await workflowService.runFODynamic({
        sessiontoken: options.sessiontoken as string,
        workflowid: LOAD_ANNOUNCEMENT_CONFIG_WORKFLOW_ID,
        input: {},
        language: options.language as any,
      });

      if (
        response.status < 200 ||
        response.status >= 300 ||
        hasErrors(response)
      ) {
        return {
          ...fallback_initial_data,
          ...hierarchy,
        };
      }

      const mapped = mapAnnouncementConfig(response);

      return {
        notification_types:
          mapped.notification_types.length > 0
            ? mapped.notification_types
            : fallback_initial_data.notification_types,
        ...hierarchy,
      };
    } catch {

      return {
        ...fallback_initial_data,
        ...hierarchy,
      };
    }
  },

  async uploadAttachment(file: File, options: ServiceOptions = {}) {
    const formData = new FormData();
    formData.append("file", file);

    return cdnServiceApi.uploadFile({
      sessiontoken: options.sessiontoken,
      file: formData,
      folderUpload: "announcements",
    });
  },

  async createAnnouncement(
    payload: CreateAnnouncementPayload,
    options: ServiceOptions = {},
  ) {
    return workflowService.runFODynamic({
      sessiontoken: options.sessiontoken as string,
      workflowid: CREATE_ANNOUNCEMENT_WORKFLOW_ID,
      input: payload,
      language: options.language as any,
    });
  },

  async updateAnnouncement(
    payload: UpdateAnnouncementPayload,
    options: ServiceOptions = {},
  ) {
    const updatePayload: UpdateAnnouncementPayload = {
      ...payload,
      publish: getCurrentUpdateDate(),
    };
    const response = await workflowService.runFODynamic({
      sessiontoken: options.sessiontoken as string,
      workflowid: UPDATE_ANNOUNCEMENT_WORKFLOW_ID,
      input: updatePayload,
      language: options.language as any,
    });

    assertWorkflowSuccess(response, "Failed to update announcement.");

    return response;
  },
};
