export enum ItemType {
    RepellFlare,
    KillFlare,
    ConstructionParts,
    DrillParts,
}

type ItemDefinition = {
    name: string,
    icon: string,
    stack: number
}

export type Inventory = Array<{ item: ItemType, count: number }>;

export const itemDefinition: Record<ItemType, ItemDefinition> = {
    [ItemType.KillFlare]: {
        name: "Red Flare",
        icon: "flare",
        stack: 1
    },

    [ItemType.RepellFlare]: {
        name: "Yellow Flare",
        icon: "flare",
        stack: 2
    },

    [ItemType.ConstructionParts]: {
        name: "Construction Parts",
        icon: "spotlight",
        stack: 1
    },

    [ItemType.DrillParts]: {
        name: "Drill Parts",
        icon: "drill",
        stack: 1
    }
}