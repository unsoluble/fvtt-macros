// For all currently selected tokens, changes their actor sheet to LootSheetNPC,
// deletes all non-lootable items, sets token Observer privs for players, and adds a treasure
// overlay icon to the body. Asks for confirmation because of the deletions.
// updated to v9 by @Muuk-e
// Original script by tas (ygg#0922) -- thanks tas!
// Evolved with help from a ton of people, notably: @Akaito, @honeybadger, @kekilla, and @cole

let d = new Dialog({
  title: 'Convert to lootable body',
  content: `Sure? This will delete any non-lootable features.`,
  buttons: {
    no: {
      icon: '<i class="fas fa-ban"></i>',
      label: 'Cancel',
    },
    yes: {
      icon: '<i class="fas fa-thumbs-up"></i>',
      label: 'Convert',
      callback: (html) => {
        ConvertToLootable();
      },
    },
  },
  default: 'no',
}).render(true);

async function ConvertToLootable() {
  for (let token of canvas.tokens.controlled) {
    // Don't run this on PC tokens by mistake
    if (token.actor.data.type === 'character') continue;

    // Remove items that shouldn't be lootable
    let itemsToDelete = token.actor.items
      .filter((item) => {
        // Weapons are fine, unless they're natural.
        if (item.type == 'weapon') {
          return item.data.data.weaponType == 'natural';
        }
        // Equipment's fine, unless it's natural armor.
        if (item.type == 'equipment') {
          return item.data.data.armor.type == 'natural';
        }
        // Item type blocklist.
        return ['class', 'spell', 'feat'].includes(item.type);
      })
      .map((item) => item.id);

    await token.document.actor.deleteEmbeddedDocuments('Item', itemsToDelete);

    // Change sheet to lootable, and give players permissions.
       let newActorData = {
      flags: {
        core: {
          sheetClass: 'dnd5e.LootSheetNPC5e',
        },
        lootsheetnpc5e: {
          lootsheettype: 'Loot',
        },
      },
    };

    let lootingUsers = game.users
      // Limit selection to Players and Trusted Players
      .filter((user) => {
        return user.role >= 1 && user.role <= 2;
      });

    // This section is a workaround for the fact that the LootSheetNPC module
    // currently uses an older currency schema, compared to current 5e expectations.
    // Need to convert the actor's currency data to the LS schema here to avoid
    // breakage. If there is already currency on the actor, it is retained.

    if (typeof token.actor.data.data.currency.cp === 'number') {
      let oldCurrencyData = token.actor.data.data.currency;
      newActorData['data.currency'] = {
        cp: { value: oldCurrencyData.cp },
        ep: { value: oldCurrencyData.ep },
        gp: { value: oldCurrencyData.gp },
        pp: { value: oldCurrencyData.pp },
        sp: { value: oldCurrencyData.sp },
      };
    }

    await token.document.actor.update(newActorData);

    // Update permissions to level 2, so players can loot
    let permissions = {};
    Object.assign(permissions, token.actor.data.permission);
    lootingUsers.forEach((user) => {
      permissions[user.data._id] = 2;
    });

    // If using Combat Utility Belt, need to remove any of its condition overlays
    // before we can add the chest icon overlay.
    if (game.modules.get('combat-utility-belt')?.active) {
      await game.cub.removeAllConditions(token);
    }

    await token.document.update({
      overlayEffect: 'icons/svg/chest.svg',
      actorData: {
        actor: {
          flags: {
            loot: {
              playersPermission: 2,
            },
          },
        },
        permission: permissions,
      },
    });
  }
}
