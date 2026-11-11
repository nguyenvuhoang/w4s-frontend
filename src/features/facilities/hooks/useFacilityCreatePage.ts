"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@shared/hooks/useRouter";

import { useWorkingProject } from "@/@core/stores/useWorkingProjectStore";
import { buildingService } from "@/features/properties/building/buildingService";
import type { BuildingSearchItem } from "@/features/properties/building/types";
import SwalAlert from "@/shared/utils/SwalAlert";

import { facilitiesText } from "../components/facility-list/facilityListHelpers";
import { mapCreateFacilityPayload } from "../services/facilityFormMapper";
import { facilityService } from "../services/facilityService";
import type {
  CreateFacilityFormValues,
  FacilitiesDictionary,
  FacilityCategoryItem,
} from "../types";

type FormErrors = Partial<Record<keyof CreateFacilityFormValues, string>>;

type Params = {
  dictionary: FacilitiesDictionary;
  locale: string;
  sessiontoken?: string;
  language?: any;
};

const isValidNumber = (value: unknown) =>
  value !== "" && Number.isFinite(Number(value));
const isNonNegativeNumber = (value: unknown) =>
  isValidNumber(value) && Number(value) >= 0;
const isNegativeNumberInput = (value: unknown) =>
  value !== "" && Number.isFinite(Number(value)) && Number(value) < 0;
const numericFields = new Set<keyof CreateFacilityFormValues>([
  "deposit_amount",
  "max_slots_per_day",
  "advance_booking_days",
  "building_id",
  "price_per_hour",
  "max_capacity",
  "max_people_per_booking",
  "max_slots_per_booking",
  "display_order",
]);
const numericTimeSlotFields = new Set<
  keyof CreateFacilityFormValues["time_slots"][number]
>(["id", "max_capacity", "day_of_week", "base_price"]);
const numericPriceRuleFields = new Set<
  keyof CreateFacilityFormValues["price_rules"][number]
>(["id", "time_slot_index", "adjustment_value", "priority"]);

const getCategoryOptionValue = (category: FacilityCategoryItem) => {
  const category_id = category.id ?? category.facility_category_id;

  if (Number.isInteger(category_id) && Number(category_id) > 0)
    return Number(category_id);

  return undefined;
};

const buildInitialForm = (): CreateFacilityFormValues => ({
  facility_code: "",
  name: "",
  project_id: "",
  facility_category_id: "",
  description: "",
  image_url: "",
  terms_url: "",
  need_accept_policy: false,
  facility_policy: "",
  require_deposit: false,
  deposit_amount: "",
  max_slots_per_day: "",
  advance_booking_days: "",
  building_id: "",
  location: "",
  price_per_hour: "",
  open_time: "06:00",
  close_time: "22:00",
  max_capacity: "",
  long_description: "",
  rules: "",
  max_people_per_booking: "",
  max_slots_per_booking: "",
  price_note: "",
  display_order: 1,
  status: "A",
  time_slots: [
    {
      id: 0,
      name: "",
      start_time: "06:00",
      end_time: "10:00",
      max_capacity: "",
      day_of_week: 1,
      base_price: "",
    },
  ],
  price_rules: [],
});

export function useFacilityCreatePage({
  dictionary,
  locale,
  sessiontoken,
  language,
}: Params) {
  const router = useRouter();
  const working_project = useWorkingProject();

  const [form, setForm] = useState<CreateFacilityFormValues>(buildInitialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [category_options, setCategoryOptions] = useState<
    FacilityCategoryItem[]
  >([]);
  const [categories_loading, setCategoriesLoading] = useState(false);
  const [building_options, setBuildingOptions] = useState<BuildingSearchItem[]>(
    [],
  );
  const [buildings_loading, setBuildingsLoading] = useState(false);
  const [buildings_error, setBuildingsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submit_error, setSubmitError] = useState<string | null>(null);
  const submitting_ref = useRef(false);
  const building_request_ref = useRef(0);

  const [selected_building, setSelectedBuilding] =
    useState<BuildingSearchItem | null>(null);
  const [building_modal_open, setBuildingModalOpen] = useState(false);
  const [building_modal_search_text, setBuildingModalSearchText] = useState("");

  const loadCategoryOptions = useCallback(
    async (project_id: number) => {
      if (!sessiontoken || !isValidNumber(project_id)) {
        setCategoryOptions([]);
        return;
      }

      setCategoriesLoading(true);

      try {
        const response = await facilityService.simpleSearchFacilityCategories({
          sessiontoken,
          language,
          filter: {
            search_text: "",
            project_id,
            page_index: 1,
            page_size: 200,
          },
        });

        setCategoryOptions(response.items);
      } catch {
        setCategoryOptions([]);
      } finally {
        setCategoriesLoading(false);
      }
    },
    [language, sessiontoken],
  );

  const loadBuildingOptions = useCallback(
    async (project_id: number) => {
      const request_id = ++building_request_ref.current;

      if (!sessiontoken || !isValidNumber(project_id)) {
        setBuildingOptions([]);
        setBuildingsError(null);
        return;
      }

      setBuildingsLoading(true);
      setBuildingsError(null);

      try {
        const response = await buildingService.simpleSearchBuildings({
          sessiontoken,
          language,
          filter: {
            search_text: "",
            project_id,
            page_index: 1,
            page_size: 200,
            status: "A",
          },
        });

        if (request_id !== building_request_ref.current) return;

        setBuildingOptions(
          response.items.filter(
            (building) =>
              building.project_id === project_id && building.status === "A",
          ),
        );
      } catch (error) {
        if (request_id !== building_request_ref.current) return;

        setBuildingOptions([]);
        setBuildingsError(
          error instanceof Error
            ? error.message
            : facilitiesText(
                dictionary,
                "load_buildings_failed",
                "Unable to load buildings.",
              ),
        );
      } finally {
        if (request_id === building_request_ref.current)
          setBuildingsLoading(false);
      }
    },
    [dictionary, language, sessiontoken],
  );

  const project_category_options = useMemo(
    () =>
      category_options.filter(
        (category) => category.project_id === Number(form.project_id),
      ),
    [category_options, form.project_id],
  );

  const category_select_options = useMemo(
    () =>
      project_category_options.filter(
        (category) => typeof getCategoryOptionValue(category) === "number",
      ),
    [project_category_options],
  );

  useEffect(() => {
    if (!working_project) return;
    if (Number(form.project_id) === working_project.id) return;

    setSubmitError(null);
    setSelectedBuilding(null);
    setForm((current) => ({
      ...current,
      project_id: working_project.id,
      building_id: "",
      facility_category_id: "",
    }));
    setErrors((current) => ({
      ...current,
      project_id: undefined,
      building_id: undefined,
      facility_category_id: undefined,
    }));
    setBuildingOptions([]);
    setBuildingsError(null);
    setBuildingModalSearchText("");
    void loadCategoryOptions(working_project.id);
    void loadBuildingOptions(working_project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working_project?.id]);

  const openBuildingModal = () => {
    if (saving || !isValidNumber(form.project_id)) return;

    setBuildingModalSearchText("");
    setBuildingModalOpen(true);
  };

  const closeBuildingModal = () => setBuildingModalOpen(false);

  const retryBuildingOptions = () => {
    if (isValidNumber(form.project_id))
      void loadBuildingOptions(Number(form.project_id));
  };

  const building_modal_items = useMemo(() => {
    const text = building_modal_search_text.trim().toLowerCase();

    if (!text) return building_options;

    return building_options.filter(
      (building) =>
        building.name.toLowerCase().includes(text) ||
        building.building_code.toLowerCase().includes(text),
    );
  }, [building_options, building_modal_search_text]);

  const selectBuilding = (building: BuildingSearchItem) => {
    setSubmitError(null);
    setSelectedBuilding(building);
    setField("building_id", String(building.id));
    setBuildingModalOpen(false);
  };

  const setField = <K extends keyof CreateFacilityFormValues>(
    key: K,
    value: CreateFacilityFormValues[K],
  ) => {
    setSubmitError(null);
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "require_deposit" && value === false) {
        next.deposit_amount = "";
      }

      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleTextChange =
    (key: keyof CreateFacilityFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      if (numericFields.has(key) && isNegativeNumberInput(value)) return;

      setField(key, value as never);
    };

  const handleCategoryChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const category_id = Number(event.target.value);
    const selected_category = category_select_options.find(
      (category) => getCategoryOptionValue(category) === category_id,
    );

    setForm((current) => ({
      ...current,
      facility_category_id: category_id,
      facility_category_code: selected_category?.category_code ?? "",
    }));
    setErrors((current) => ({ ...current, facility_category_id: undefined }));
  };

  const handleTimeSlotChange = (
    index: number,
    key: keyof CreateFacilityFormValues["time_slots"][number],
    value: string | number,
  ) => {
    if (numericTimeSlotFields.has(key) && isNegativeNumberInput(value)) return;

    setForm((current) => ({
      ...current,
      time_slots: current.time_slots.map((slot, slot_index) =>
        slot_index === index ? { ...slot, [key]: value } : slot,
      ),
    }));
  };

  const handleAddTimeSlot = () => {
    setForm((current) => ({
      ...current,
      time_slots: [
        ...current.time_slots,
        {
          id: 0,
          name: "",
          start_time: current.open_time || "06:00",
          end_time: current.close_time || "22:00",
          max_capacity: "",
          day_of_week: 1,
          base_price: "",
        },
      ],
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setForm((current) => ({
      ...current,
      time_slots: current.time_slots.filter(
        (_, slot_index) => slot_index !== index,
      ),
      price_rules: current.price_rules
        .filter(
          (rule) =>
            rule.time_slot_index === undefined ||
            rule.time_slot_index === "" ||
            Number(rule.time_slot_index) !== index,
        )
        .map((rule) => {
          if (
            rule.time_slot_index === undefined ||
            rule.time_slot_index === "" ||
            Number(rule.time_slot_index) < index
          )
            return rule;

          return { ...rule, time_slot_index: Number(rule.time_slot_index) - 1 };
        }),
    }));
  };

  const handlePriceRuleChange = (
    index: number,
    key: keyof CreateFacilityFormValues["price_rules"][number],
    value: string | number,
  ) => {
    if (numericPriceRuleFields.has(key) && isNegativeNumberInput(value)) return;

    setForm((current) => ({
      ...current,
      price_rules: current.price_rules.map((rule, rule_index) =>
        rule_index === index ? { ...rule, [key]: value } : rule,
      ),
    }));
  };

  const handleAddPriceRule = () => {
    setForm((current) => ({
      ...current,
      price_rules: [
        ...current.price_rules,
        {
          id: 0,
          time_slot_index: current.time_slots.length > 0 ? 0 : undefined,
          rule_type: "WEEKDAY",
          price_adjustment_type: "FIXED_PRICE",
          adjustment_value: "",
          priority: current.price_rules.length + 1,
        },
      ],
    }));
  };

  const handleRemovePriceRule = (index: number) => {
    setForm((current) => ({
      ...current,
      price_rules: current.price_rules.filter(
        (_, rule_index) => rule_index !== index,
      ),
    }));
  };

  const validate = () => {
    const next_errors: FormErrors = {};

    if (!form.facility_code.trim())
      next_errors.facility_code = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    if (!form.name.trim())
      next_errors.name = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );

    if (!isValidNumber(form.project_id)) {
      next_errors.project_id = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    } else if (
      !working_project ||
      working_project.id !== Number(form.project_id)
    ) {
      next_errors.project_id = facilitiesText(
        dictionary,
        "validation_project",
        "Select a valid project",
      );
    }

    const selected_category_id = Number(form.facility_category_id);
    const has_valid_category = category_select_options.some(
      (category) => getCategoryOptionValue(category) === selected_category_id,
    );

    if (!isValidNumber(form.facility_category_id) || !has_valid_category) {
      next_errors.facility_category_id = facilitiesText(
        dictionary,
        "category_id_missing",
        "A real facility category ID is required",
      );
    }

    if (!isNonNegativeNumber(form.display_order))
      next_errors.display_order = facilitiesText(
        dictionary,
        "validation_non_negative_number",
        "Enter a number greater than or equal to 0",
      );

    if (!isValidNumber(form.building_id))
      next_errors.building_id = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    const matched_building = building_options.find(
      (building) => building.id === Number(form.building_id),
    );
    if (
      !matched_building ||
      matched_building.project_id !== Number(form.project_id)
    ) {
      next_errors.building_id = facilitiesText(
        dictionary,
        "validation_building",
        "Select a valid building for the selected project",
      );
    }
    if (!form.location.trim())
      next_errors.location = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    if (!form.open_time)
      next_errors.open_time = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    if (!form.close_time)
      next_errors.close_time = facilitiesText(
        dictionary,
        "validation_required",
        "Required",
      );
    if (
      form.open_time &&
      form.close_time &&
      form.close_time <= form.open_time
    ) {
      next_errors.close_time = facilitiesText(
        dictionary,
        "validation_end_time",
        "End time must be later than start time",
      );
    }
    if (
      form.time_slots.some(
        (slot) =>
          !slot.name.trim() ||
          !slot.start_time ||
          !slot.end_time ||
          !isNonNegativeNumber(slot.max_capacity) ||
          !isNonNegativeNumber(slot.day_of_week) ||
          !isNonNegativeNumber(slot.base_price),
      )
    ) {
      next_errors.time_slots = facilitiesText(
        dictionary,
        "validation_time_slots",
        "Complete all time slot fields",
      );
    }
    if (
      form.price_rules.some(
        (rule) =>
          !rule.rule_type ||
          !rule.price_adjustment_type ||
          !isNonNegativeNumber(rule.adjustment_value) ||
          !isNonNegativeNumber(rule.priority),
      )
    ) {
      next_errors.price_rules = facilitiesText(
        dictionary,
        "validation_price_rules",
        "Complete all price rule fields",
      );
    }

    const optional_numeric_fields: Array<keyof CreateFacilityFormValues> = [
      "max_slots_per_day",
      "advance_booking_days",
      "price_per_hour",
      "max_capacity",
      "max_people_per_booking",
      "max_slots_per_booking",
    ];

    optional_numeric_fields.forEach((field) => {
      const value = form[field];

      if (value !== "" && !isNonNegativeNumber(value)) {
        next_errors[field] = facilitiesText(
          dictionary,
          "validation_non_negative_number",
          "Enter a number greater than or equal to 0",
        );
      }
    });

    if (form.require_deposit) {
      if (!isNonNegativeNumber(form.deposit_amount)) {
        next_errors.deposit_amount = facilitiesText(
          dictionary,
          "validation_deposit_amount",
          "Enter a valid amount greater than or equal to 0",
        );
      }
    }

    setErrors(next_errors);

    return Object.keys(next_errors).length === 0;
  };

  const handleReset = () => {
    building_request_ref.current += 1;
    setForm({ ...buildInitialForm(), project_id: working_project?.id ?? "" });
    setErrors({});
    setSubmitError(null);
    setCategoryOptions([]);
    setBuildingOptions([]);
    setBuildingsError(null);
    setSelectedBuilding(null);
    setBuildingModalSearchText("");

    if (working_project) {
      void loadCategoryOptions(working_project.id);
      void loadBuildingOptions(working_project.id);
    }
  };

  const goBack = () => {
    router.push(`/${locale}/facilities/facilities?tab=facilities`);
  };

  const submit = async () => {
    if (submitting_ref.current) return;
    if (!validate()) return;

    submitting_ref.current = true;
    setSaving(true);
    setSubmitError(null);

    try {
      const payload = mapCreateFacilityPayload(form);

      await facilityService.createFacility({
        sessiontoken,
        language,
        fields: payload,
      });

      SwalAlert(
        "success",
        facilitiesText(
          dictionary,
          "create_success",
          "Facility has been created",
        ),
        "center",
      );
      router.push(`/${locale}/facilities/facilities?tab=facilities`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : facilitiesText(
              dictionary,
              "create_failed",
              "Unable to create facility",
            );

      setSubmitError(message);
      SwalAlert("error", message, "center");
    } finally {
      submitting_ref.current = false;
      setSaving(false);
    }
  };

  return {
    form,
    errors,
    category_options: category_select_options,
    categories_loading,
    building_options,
    buildings_loading,
    buildings_error,
    saving,
    submit_error,
    selected_project: working_project,
    selected_building,
    building_modal_open,
    building_modal_items,
    building_modal_search_text,
    openBuildingModal,
    closeBuildingModal,
    setBuildingModalSearchText,
    selectBuilding,
    retryBuildingOptions,
    setField,
    handleTextChange,
    handleCategoryChange,
    handleAddTimeSlot,
    handleRemoveTimeSlot,
    handleTimeSlotChange,
    handleAddPriceRule,
    handleRemovePriceRule,
    handlePriceRuleChange,
    handleReset,
    goBack,
    submit,
  };
}
