// For all currently selected tokens, changes their actor sheet to LootSheetNPC,
// deletes all non-lootable items, sets token Observer privs for players, and adds a treasure
// overlay icon to the body. Asks for confirmation because of the deletions.
//
// Built with help from a ton of people, notably: @Akaito, @honeybadger, @kekilla, and @cole

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
        ConvertToLootable();
      }
    },
  },
  default: 'no',
}).render(true);

async function ConvertToLootable(){
  for (let token of canvas.tokens.controlled) {
  
    // Don't run this on PC tokens by mistake
    if (token.actor.data.type === 'character')
      continue;
    
    // Remove items that shouldn't be lootable
    let newItems = token.actor.data.items
      .filter(item => {
        // Weapons are fine, unless they're natural
        if (item.type == 'weapon') {
          return item.data.weaponType != 'natural';
        }
        // Equipment's fine, unless it's natural armor
        if (item.type == 'equipment') {
          if (!item.data.armor)
          return true;
          return item.data.armor.type != 'natural';
        }
        return !(['class', 'spell', 'feat']
          .includes(item.type));
      });
    await token.actor.update({
      "items": newItems
    });

    // Change sheet to lootable, and give players permissions.
    let newActorData = {
      'flags': {
          'core': {
            'sheetClass': 'dnd5e.LootSheet5eNPC'
          },
        'lootsheetnpc5e': {
          'lootsheettype': 'Loot'
        }
      }
    };
    
    let lootingUsers= game.users.entries
    // Limit selection to Players and Trusted Players
      .filter(user => {return user.role >= 1 && user.role <= 2});

    // This section is a workaround for the fact that the LootSheetNPC module
    // currently uses an older currency schema, compared to current 5e expectations.
    // Need to convert the actor's currency data to the LS schema here to avoid
    // breakage. If there is already currency on the actor, it is retained.

    if (typeof(token.actor.data.data.currency.cp) === "number") {
      let oldCurrencyData = token.actor.data.data.currency;
      newActorData['data.currency'] = {
        'cp': {'value': oldCurrencyData.cp},
        'ep': {'value': oldCurrencyData.ep},
        'gp': {'value': oldCurrencyData.gp},
        'pp': {'value': oldCurrencyData.pp},
        'sp': {'value': oldCurrencyData.sp}
      };
    }

    /* Uncomment this section if you want a set amount of gold automatically added
    
    // See if the token already has any gold
    let currencyArray = [];
    for (const currency in newActorData){
      currencyArray.push(newActorData[currency].value);
    }
    const hasGold = Math.max(...currencyArray) > 0;

    // If the actor has no gold, assign gold by CR: gold = 0.6e(0.15*CR)
    if (!hasGold){
      const exponent = 0.15 * (getProperty(token.actor, "data.data.details.cr") ?? 0);
      let gold = Math.round(0.6 * 10 * (10 ** exponent));

      // Ensure it can divide evenly across all looting players
      gold = gold + (gold % Math.max(lootingUsers.length, 1)) ?? 0;

      newActorData['data.currency.gp.value'] = gold;
    }
    
    */

    await token.actor.update(newActorData);

    // Update permissions to level 2, so players can loot
    let permissions = {};
    Object.assign(permissions, token.actor.data.permission);
    lootingUsers.forEach(user => {
      permissions[user.data._id] = 2;
    });
    
    // If using Combat Utility Belt, need to remove any of its condition overlays
    // before we can add the chest icon overlay.
    if (game.modules.get("combat-utility-belt")?.active) {
      await game.cub.removeAllConditions(token);
    }
        
    await token.update({
      "overlayEffect" : 'icons/svg/chest.svg',
      "actorData": {
        "actor": {
          "flags": {
            "loot": {
              "playersPermission": 2
            }
          }
        },
        "permission": permissions
      }
    });
  }
}
