// For all currently selected tokens, changes their actor sheet to LootSheetNPC,
// deletes all Feat items, sets token Observer privs for players, and adds a treasure
// overlay icon to the body. Asks for confirmation because of the deletions.

let d = new Dialog({
title: 'Convert to lootable body',
content: `Sure?`,
buttons: {
    no: {
        icon: '<i class="fas fa-ban"></i>',
        label: 'Cancel'
    },
    yes: {
        icon: '<i class="fas fa-thumbs-up"></i>',
        label: 'Convert',
        callback: (html) => {
            main();
        }
    },
},
default: 'no',
}).render(true);

async function main() {
    for (let token of canvas.tokens.controlled) {
        await token.actor.setFlag("core", "sheetClass", "dnd5e.LootSheet5eNPC");
        await token.update({
            'actorData.permission.default': ENTITY_PERMISSIONS.OBSERVER,
            overlayEffect : `icons/svg/chest.svg`
        });
        const feats = token.actor.items.filter(i => i.type === "feat");
        const deletions = feats.map(i => i._id);
        await token.actor.deleteEmbeddedEntity("OwnedItem", deletions);
    }
}