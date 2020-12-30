// Change selected tokens' sheets to LootSheets, but don't change anything else.

async function main() {
    for (let token of canvas.tokens.controlled) {
        token.actor.setFlag("core", "sheetClass", "dnd5e.LootSheet5eNPC");
    }
}
main();