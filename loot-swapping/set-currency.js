new Dialog({
	title: "Apply Currency to Selected Tokens",
	content: `<style>.loot-sheet-currency td:first-child{text-align:right;padding-right:0.75em}</style>
<p>Enter the amounts or roll expressions to be added to each selected token's currency.</p>
<table class="loot-sheet-currency">
<tr><td>Platinum</td><td><input name="pp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
<tr><td>    Gold</td><td><input name="gp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
<tr><td>Electrum</td><td><input name="ep" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
<tr><td>  Silver</td><td><input name="sp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
<tr><td>  Copper</td><td><input name="cp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
<tr><td>Function</td><td><select>
<option value="rep" selected>Replace values</option>
<option value="add">Add Values</option>
<option value="sub">Subtract Values</option>
<option value="mul">Multiply Values</option>
<option value="div">Divide Values</option>
</select></td></tr>
</table>`,
	buttons: {
		cancel: { label: "Cancel", icon: '<i class="fas fa-times"></i>' },
		submit: {
			label: "Submit", icon: '<i class="fas fa-save"></i>',
			callback: html => {
				const actors = canvas.tokens.controlled.map(x => x.actor);
				if (actors.length == 0) { ui.notifications.info("No tokens selected"); return; }
				const roll = x => x.length > 0 ? Roll.create(x) : Roll.create('0');
				const curr = {
					pp: roll(html.find('input[name="pp"]').val()),
					gp: roll(html.find('input[name="gp"]').val()),
					ep: roll(html.find('input[name="ep"]').val()),
					sp: roll(html.find('input[name="sp"]').val()),
					cp: roll(html.find('input[name="cp"]').val())
				};
				const op = html.find('select').val();
				actors.forEach(x => {
					const currency = duplicate(x.data.data.currency);
					var current = 0;
					var roll = 0;
					var result = 0;
					for (let key of Object.keys(currency)) {
						current = currency[key].value !== undefined ? parseInt(currency[key].value) : parseInt(currency[key]);
						roll = curr[key].reroll().total;
						if (isNaN(current)) current = 0;
            if(op === 'rep') result = roll;
            else if(op === 'add') result = current + roll;
            else if(op === 'sub') result = current - roll;
            else if(op === 'mul') result = current * roll;
            else if(op === 'div') result = current / roll;
						if (currency[key].value === undefined) currency[key] = result.toString();
						else currency[key].value = result;
					}
					x.update({ data: { currency } });
				});
			}
		}
	}, default: "submit"
}).render(true);
