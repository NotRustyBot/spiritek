export enum ItemType {
    RepellFlare,
    KillFlare,
    ConstructionParts
}

type ItemDefinition = {
    name: string,
    icon: string
}

export const itemDefinition: Record<ItemType, ItemDefinition> = {
    [ItemType.KillFlare]: {
        name: "Red Flare",
        icon: "img/flare.png"
    },

    [ItemType.RepellFlare]: {
        name: "Yellow Flare",
        icon: "img/flare.png"
    },

    [ItemType.ConstructionParts]: {
        name: "Construction Parts",
        icon: "img/floodlight.png"
    }
}