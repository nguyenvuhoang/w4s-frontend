import TableChartIcon from '@mui/icons-material/TableChart';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import LayoutIcon from '@mui/icons-material/BorderAll';
import MultiSelectIcon from '@mui/icons-material/FilterList';
import CurrencyIcon from '@mui/icons-material/AttachMoney';
import TextFieldIcon from '@mui/icons-material/TextFields';
import ButtonIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonIcon from '@mui/icons-material/RadioButtonUnchecked';
import LabelIcon from '@mui/icons-material/Label';
import SelectIcon from '@mui/icons-material/ArrowDropDownCircle';
import ChartIcon from '@mui/icons-material/BarChart';

export const controlGroups = [
    {
        title: 'Layout Fields',
        controls: [
            { id: 'layout', label: 'Layout', icon: <LayoutIcon /> },
            { id: 'view', label: 'View', icon: <ViewModuleIcon /> },
        ],
    },
    {
        title: 'Advanced Fields',
        controls: [
            { id: 'table-form', label: 'Table Form', icon: <TableChartIcon /> },
            { id: 'list-checkbox', label: 'List CheckBox', icon: <CheckBoxIcon /> },
            { id: 'multivalue', label: 'Multivalue', icon: <MultiSelectIcon /> },
            { id: 'currency', label: 'Currency', icon: <CurrencyIcon /> },
        ],
    },
    {
        title: 'Basic Fields',
        controls: [
            { id: 'text-input', label: 'Text Input', icon: <TextFieldIcon /> },
            { id: 'button', label: 'Button', icon: <ButtonIcon /> },
            { id: 'checkbox', label: 'Checkbox', icon: <CheckBoxIcon /> },
            { id: 'radio-button', label: 'Radio Button', icon: <RadioButtonIcon /> },
            { id: 'label', label: 'Label', icon: <LabelIcon /> },
            { id: 'select', label: 'Select', icon: <SelectIcon /> },
            { id: 'chart', label: 'Chart', icon: <ChartIcon /> },
        ],
    },
];
