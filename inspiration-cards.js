const deckTable = game.tables.getName('Inspiration Deck');
const packName = 'shared-compendiums.inspiration-cards';
const actors = ['Barnabus Truesheel', 'Lachish', 'Natriel Adonai', 'Owlgar', 'Phingo Underfoot'];

const DistributeItems = true;
const DeleteExisting = false;

// Open the div, set the BG styles.
let messageBody = `<div style='
    text-align: center;
    line-height: 1.5em;
    border-radius: .8em;
    box-shadow:  0 8px 12px rgba(0, 0, 0, 0.5);
    padding: 10px 0 14px 0;
    margin: 15px;
    background: url(assets/Inspiration/inspiration-card-bg-nebula.webp);
    background-size: cover;
    '>`;

// Reset the rolls array, which emulates Draw Without Replacement.
let rolls = [];

(async () => {
  for (const actor of actors) {
    // Draw a card for each actor.
    await doDraw(actor);
    // If desired, delete any existing inspiration cards from the actors.
    if (DeleteExisting === true) {
      let existingCards = game.actors.getName(actor).items.filter((item) => {
        if (item.data.data.source == 'Inspiration Deck') {
          return true;
        }
      });
        
      //collect IDs to output (and echo what we are deleting)
      const deleteIds = existingCards.map( (card) => {
          console.log(`Deleting ${card.name} from ${actor}`);
          return card.id;
      });
        
      //delete these inspiration card IDs
      await game.actors.getName(actor).deleteEmbeddedDocuments("Item",deleteIds);
    }
  }

  // Close the BG div at the end.
  messageBody += '</div>';

  let chatData = {
    user: game.user._id,
    speaker: ChatMessage.getSpeaker({ alias: 'Inspiration!' }),
    content: messageBody,
  };
  ChatMessage.create(chatData, {});
})();

async function doDraw(actor) {
  let roll = '';
  do {
    //future proof against 0.9 async rolls
    roll = await(new Roll(deckTable.data.formula).evaluate({async:true}));
  } while (rolls.includes(roll.total));

  rolls.push(roll.total);
  const result = deckTable.getResultsForRoll(roll.total)[0];

  const destinationActor = game.actors.getName(actor);

  let item = await searchItem({ key: packName, name: result.data.text });
  let entity = await findItemInCompendium({ keys: packName, name: item.name, id: item._id });

  messageBody +=
    `<div style='
      color: #efefe0;
      margin-top: 5px;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
      '>` +
    actor +
    ` gets</div><a
      class='entity-link'
      data-id='` +
    item._id +
    `'data-pack='shared-compendiums.inspiration-cards'
      style='
      border: none;
      background: none;'>
      <img style='
      width: 80%;
      margin-top: 2px;
      border: none;
    'src=` +
    buildImageURL(item.name) +
    '></a><br>';

  if (DistributeItems) await destinationActor.createEmbeddedDocuments("Item", [entity]);
}

// These search and find functions I'm sure could be consolidated/simplified,
// but they work as-is so I ain't touching them.
async function searchItem({ key, name = '' }) {
  let pack = game.packs.get(key);
  let pack_index = pack.index.length > 1 ? pack.index : await pack.getIndex();
  let item_index = pack_index.find((i) => i.name.toLowerCase() === name.toLowerCase());
  if (item_index)
    return {
      comp_link: `@Compendium[${key}.${item_index._id}]{${item_index.name}}`,
      img_link: `<img src="${item_index.img}" width="25" height="25">`,
      key: key,
      img: item_index.img,
      name: item_index.name,
      _id: item_index._id,
    };
  return undefined;
}

async function findItemInCompendium({ keys = [], name = '', id = '' }) {
  keys = keys instanceof Array ? keys : [keys];
  for (let key of keys) {
    let pack = game.packs.get(key);
    let itemID = id ?? (await pack.getIndex()).find((i) => i.name === name)?._id;
    if (itemID) return await pack.getDocument(itemID);
  }
}

function buildImageURL(name) {
  let theURL = '/assets/Inspiration/standard/' + string_to_slug(name) + '.webp';
  return theURL;
}

function string_to_slug(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  // remove accents, swap ñ for n, etc
  var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  var to = 'aaaaeeeeiiiioooouuuunc------';
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
  return str;
}
