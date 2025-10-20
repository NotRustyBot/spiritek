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
        name: "Kill Flare",
        icon: "flareR",
        stack: 1
    },

    [ItemType.RepellFlare]: {
        name: "Repell Flare",
        icon: "flareY",
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