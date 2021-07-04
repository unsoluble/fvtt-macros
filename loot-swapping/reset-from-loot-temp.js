// Change selected tokens' sheets back to default.

async function main() {
  for (let token of canvas.tokens.controlled) {
    await token.document.actor.setFlag('core', 'sheetClass', 'Default');
    await token.document.update({
      'actorData.permission.default': CONST.ENTITY_PERMISSIONS.NONE,
      overlayEffect: '',
    });
  }
}
main();
