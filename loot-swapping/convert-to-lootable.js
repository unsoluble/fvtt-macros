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
        let newItems = token.actor.data.items
        .filter(item => {
            if (item.type == 'weapon') {
                return item.data.weaponType != 'natural';
            }
            if (item.type == 'equipment') {
                if (!item.data.armor)
                    return true;
                return item.data.armor.type != 'natural';
            }
            return !(['class', 'spell', 'feat']
            .includes(item.type));
        });
        
        // This section is a workaround for the fact that the LootSheetNPC module
        // currently uses an older currency schema, compared to current 5e expectations.
        // Need to convert the actor's currency data to the LS schema here to avoid
        // breakage. If there is already currency on the actor, it is retained.
        
        let newCurrencyData = {};
        if (typeof(token.actor.data.data.currency.cp) === "number") {
            newCurrencyData['data.currency'] = {
                'cp': {'value': token.actor.data.data.currency.cp},
                'ep': {'value': token.actor.data.data.currency.ep},
                'gp': {'value': token.actor.data.data.currency.gp},
                'pp': {'value': token.actor.data.data.currency.pp},
                'sp': {'value': token.actor.data.data.currency.sp}
            };
        }
        await token.actor.update(newCurrencyData);
        
        await token.actor.setFlag("core", "sheetClass", "dnd5e.LootSheet5eNPC");
        await token.update({
            'actorData.permission.default': ENTITY_PERMISSIONS.OBSERVER,
            overlayEffect : `icons/svg/chest.svg`
        });
        await token.actor.update( {"items": newItems} );
    }
}
