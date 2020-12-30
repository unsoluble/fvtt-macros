// Change selected tokens' sheets back to default.

async function main() {
    for (let token of canvas.tokens.controlled) {
        token.actor.setFlag("core", "sheetClass", "Default");
        token.update({
            'actorData.permission.default': ENTITY_PERMISSIONS.NONE
        });
    }
}
main();