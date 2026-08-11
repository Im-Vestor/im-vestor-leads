"use client";

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";

type Area = { id: string; name: string };

// Searchable multi-select over the shared Area list. `value` is the selected
// area ids. Pass `max` to cap the selection (investors are uncapped).
export function AreaMultiSelect({
	areas,
	value,
	onChange,
	id,
	placeholder,
	emptyLabel,
	max,
}: {
	areas: Area[];
	value: string[];
	onChange: (ids: string[]) => void;
	id?: string;
	placeholder?: string;
	emptyLabel?: string;
	max?: number;
}) {
	const anchor = useComboboxAnchor();
	const selected = areas.filter((a) => value.includes(a.id));
	const atMax = max !== undefined && value.length >= max;

	return (
		<Combobox
			multiple
			items={areas}
			value={selected}
			onValueChange={(next: Area[]) =>
				onChange((max ? next.slice(0, max) : next).map((a) => a.id))
			}
			itemToStringLabel={(area: Area) => area.name}
			isItemEqualToValue={(a, b) => a.id === b.id}
		>
			<ComboboxChips ref={anchor}>
				<ComboboxValue>
					{(v: Area[]) => (
						<>
							{v.map((area) => (
								<ComboboxChip key={area.id}>{area.name}</ComboboxChip>
							))}
							<ComboboxChipsInput
								id={id}
								placeholder={v.length === 0 ? placeholder : ""}
							/>
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<ComboboxContent anchor={anchor}>
				<ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
				<ComboboxList>
					{(area: Area) => (
						<ComboboxItem
							key={area.id}
							value={area}
							disabled={atMax && !value.includes(area.id)}
						>
							{area.name}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
