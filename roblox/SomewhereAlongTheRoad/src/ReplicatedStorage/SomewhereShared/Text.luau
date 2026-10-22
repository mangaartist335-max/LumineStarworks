--!strict
-- All the words in town. Edit freely; nothing here is load-bearing code.

export type Entry = { Title: string, Body: string }

local Text = {}

-- Things worth finding. Any three complete the objective.
Text.Discoveries = {
	tiny_door = {
		Title = "The Tiny Door",
		Body = "Someone built a tiny wooden door into the roots of this old oak. It has a doormat. The doormat says WELCOME.\n\nYou don't knock, but you think about it.",
	},
	postcard_wall = {
		Title = "The Postcard Wall",
		Body = "Hundreds of postcards from everywhere. Dot pins up every single one.\n\nThe newest says: 'Still thinking about the pie. See you next spring. — Lou, Ohio'",
	},
	forever_puzzle = {
		Title = "The Forever Puzzle",
		Body = "A 5,000-piece puzzle of a lighthouse. A folded card says: 'Add one piece per visit. Started 2009.'\n\nYou add a piece. It's sky. It's always sky.",
	},
	sunflower_truck = {
		Title = "The Sunflower Truck",
		Body = "An old pickup that retired out here in the field. Somebody filled the bed with soil and planted sunflowers.\n\nThe sunflowers are doing great. The truck looks proud of them.",
	},
	guestbook = {
		Title = "The Bus Stop Guestbook",
		Body = "A notebook tied to the shelter with string. Travelers leave notes.\n\n'Missed my bus. Found the diner. Not mad about it.'\n'Saw a deer!!!'\n'Hi to whoever reads this next. Hope your day is a good one.'",
	},
	lookout = {
		Title = "The Lookout",
		Body = "A bench at the top of the hill with a little brass plaque:\n\n'Best view in the county. Sit a while. Bring a sandwich next time.'",
	},
	-- Event discoveries only appear when the world decides to do something.
	traveler = {
		Title = "The Traveler",
		Body = "A traveler with a suitcase and nowhere in particular to be. You talked about the weather for a bit. It was nice.",
	},
	ice_cream_truck = {
		Title = "The Ice Cream Truck",
		Body = "It plays the same little tune every time. You'll be humming it for the rest of the day, and that's fine.",
	},
	big_duck = {
		Title = "The Big Duck",
		Body = "A flatbed truck carrying a rubber duck the size of a house. Nobody in town has an explanation. Nobody in town wants one.",
	},
	hay_wagon = {
		Title = "Rush Hour",
		Body = "A tractor pulling a hay wagon at about four miles an hour. The driver waved. This is what traffic looks like here.",
	},
	woods_deer = {
		Title = "Something in the Woods",
		Body = "Just a deer. It looks at you like you're the strange one. Fair enough.",
	},
	woods_owl = {
		Title = "Something in the Woods",
		Body = "An owl. It hoots once, very seriously, like it's making an important announcement.",
	},
	woods_raccoon = {
		Title = "Something in the Woods",
		Body = "A raccoon holding a sandwich. Nobody knows where it got the sandwich. The raccoon isn't telling.",
	},
	lost_and_found = {
		Title = "Lost and Found",
		Body = "Things turn up along the road sometimes. This one had a story.",
	},
	back_in_fifteen = {
		Title = "Back in Fifteen",
		Body = "The store closed for a little while. Marv left a note. Marv always leaves a note.",
	},
	runaway_mower = {
		Title = "The Runaway Mower",
		Body = "Hollis's lawn mower made a break for it again. He says it happens every Tuesday. It is not Tuesday.",
	},
	chicken_crossing = {
		Title = "Why It Crossed",
		Body = "A chicken crossed the road. Nobody knows why. Dot says she's not even going to ask.",
	},
	quiet_sunset = {
		Title = "A Quiet Sunset",
		Body = "You stood still and watched the sky do its thing for a while. Good call.",
	},
	the_compass = {
		Title = "The Compass",
		Body = "A small brass compass, warm in your hand. The needle doesn't point north.\n\nIt points back toward the bus stop. Huh.",
	},
} :: { [string]: Entry }

-- Things you can read around town.
Text.Notes = {
	bulletin = {
		Title = "Community Board",
		Body = "LOST: Garden gnome. Answers to Gerald. Little red hat. Please return to the yellow house. — Hollis\n\nGuitar lessons! I know four songs. Soon you'll know four songs. — Ray\n\nFOUND: one cat. Turns out it was my cat. Thanks, everyone. — Dot\n\nBake sale Sunday at the diner. Bring a pie, take a pie.\n\nHas anybody else seen the little lights out in the woods? Asking for a friend. (The friend is me.)",
	},
	timetable = {
		Title = "Route 9 Timetable",
		Body = "Next bus: Soon.\nFollowing bus: Also soon.\n\nPlease be patient. The driver is very nice and stops for ducks.",
	},
	employees_only = {
		Title = "Back Door",
		Body = "A sign: EMPLOYEES ONLY.\n\nUnderneath, in smaller handwriting: '...and Gerald.'",
	},
	payphone = {
		Title = "Payphone",
		Body = "You pick up. A recorded voice says: 'Thank you for calling the Halfway Mart. We are open. Probably.'\n\nClick.",
	},
	menu_board = {
		Title = "Mile Marker Diner",
		Body = "COFFEE — bottomless\nPIE OF THE DAY — whatever Dot felt like making\nGRILLED CHEESE — exactly how you remember it\nSOUP — ask\n\nNo substitutions. Okay, a few substitutions.",
	},
	welcome_sign = {
		Title = "Welcome to Halfway",
		Body = "WELCOME TO HALFWAY\nPopulation: enough\n\nDrive slow. We like you.",
	},
	trail_sign = {
		Title = "Trail Sign",
		Body = "LOOKOUT TRAIL →\nCreek, old oak, best view in the county.\n\nSomeone has added in pen: 'and a guy named Wendell'",
	},
	house_tv = {
		Title = "Television",
		Body = "A cooking show. The host is making the same pie Dot makes, but worse. You feel oddly loyal.",
	},
	fridge_drawings = {
		Title = "Fridge",
		Body = "Crayon drawings held up with magnets: a cat, a sun with sunglasses, and what is either a horse or Hollis.",
	},
	mailbox = {
		Title = "Mailbox",
		Body = "Just a seed catalog and a postcard that says 'Wish you were here!' from someone who lives two houses down.",
	},
}

Text.ClosedNotes = {
	"BACK IN 15 MIN.\nWent to look at a cloud.\n— Marv",
	"CLOSED FOR A SEC.\nGone to the diner for pie. Back when it's eaten.\n— Marv",
	"BACK SOON!\nHelping Hollis look for his mower.\n— Marv",
	"BACK IN 10.\nIf it's urgent, it probably isn't.\n— Marv",
}

Text.LockedDoors = {
	"Locked. Someone inside is practicing the trumpet. They're getting better.",
	"Locked. A dog barks once, politely, then goes back to sleep.",
	"Locked. A little sign says: 'Out picking apples. Back whenever.'",
	"Locked. You can smell cookies. That's a little unfair.",
}

Text.RoadsideObjects = {
	gnome = "A garden gnome in a little red hat, sitting in the grass like he's waiting for a ride.\n\nThis must be Gerald. He seems to be having a nice time.",
	umbrella = "A red umbrella lying open and upside down, holding a little puddle like a bowl. A small bird is using it as a bath. Good for the bird.",
	suitcase = "A suitcase with a luggage tag: 'If found, please keep the snacks inside. They're for you. — R.'\n\nThere are, in fact, snacks.",
	sunflowers = "A jar of sunflowers set carefully by the road with a little note: 'For whoever needs these today.'",
	books = "Three library books, neatly stacked. Overdue since 1998. The top one is called 'How to Be on Time.'",
	radio = "A little transistor radio playing to nobody in particular. It's tuned to a station that only plays slow songs. It's a good song.",
}

Text.NPC = {
	Marv = {
		"Hey there. Take your time. Nobody's in a hurry here. Not even me, and I'm working.",
		"We've got coffee, snacks, and a lot of opinions about the weather.",
		"If you see a gnome out there, his name's Gerald. Long story.",
		"Quiet day. I like quiet days.",
		"Sodas are in the back. The orange one's the best one. That's not up for debate.",
	},
	Dot = {
		"Sit anywhere, hon. Coffee's always on.",
		"Pie of the day is whatever I felt like making. Today I felt like making pie.",
		"That puzzle's been going since 2009. We're getting close. Probably.",
		"Truckers keep sending me postcards. I keep pinning 'em up. That's the whole system.",
	},
	Hollis = {
		"Morning! Or afternoon. I stopped checking.",
		"These tomatoes are coming along. Slowly. Like me.",
		"If my lawn mower comes by, don't make eye contact. It gets ideas.",
		"Door's open if you want to say hi to the cat. She won't get up, but she'll know.",
	},
	Wendell = {
		"Haven't caught a fish in years. Best hobby I ever picked up.",
		"Creek's low this year. Fish are probably on vacation.",
		"Pull up a rock. Plenty of quiet to go around.",
		"Heard something rustling up the trail earlier. Probably that deer. She's nosy.",
	},
	Traveler = {
		"Waiting on the bus. It's late, but so am I, usually.",
		"I've been through a lot of little towns. This one's got a good feel to it.",
		"You ever just pick a direction and go? Highly recommend it.",
		"Somebody told me the pie here was worth the trip. They were right.",
	},
}

Text.Ambient = {
	Marv = { "Hm hm hmm...", "Where did I put that pen.", "Restock tomorrow. Probably." },
	Dot = { "Order up! ...oh, that one's mine.", "Who wants a refill?", "Lovely day for it." },
	Hollis = { "Come on, tomatoes.", "Beautiful out.", "Now where's that trowel." },
	Wendell = { "Any minute now.", "Nice and quiet.", "*whistles softly*" },
}

Text.Lines = {
	MarvLeaving = "Gonna step out for a minute. Back soon!",
	MarvBack = "And we're back. Did I miss anything?",
	MarvOutage = "Aaand there go the lights.",
	MarvPowerBack = "There we go.",
	DotOutage = "Nobody panic, the pie's still cold.",
	HollisMower = "Not again! Come back here!",
	HollisMowerCaught = "Every Tuesday. Every single Tuesday.",
	DotChicken = "I'm not even going to ask.",
	TravelerBus = "That's my ride. Take care of this place.",
	IceCreamDriver = "Ice cream! Free today. Don't tell my boss. I'm the boss.",
	DuckDriver = "Don't ask!",
	TractorDriver = "Afternoon!",
	CatPet = "The cat allows it.",
	CoffeeGive = "Here you go. Careful, it's hot.",
	PieGive = "Cherry today. Or maybe it's apple. It's pie, hon.",
	SodaGive = "Good choice.",
	SnackGive = "Chips are on the house. Don't tell anyone. I'm the manager.",
	IceCreamGive = "Two scoops. One for now, one for later. Kidding, eat both.",
	AlreadyHave = "You've already got one of those.",
	Finished = "That hit the spot.",
	StoreClosedDoor = "The door's locked. There's a note taped to the glass.",
	JukeboxNoMusic = "The jukebox lights up and hums a song you almost remember.",
	SwitchOn = "Click.",
	ObjectiveDone = "That's three. The road keeps going, if you do.",
	TitleSub = "a small town, mostly quiet",
}

-- Shown only when the matching sound isn't configured (see Config.SubtleHints).
Text.Hints = {
	WoodsNoise = "Something is rustling around in the woods.",
	IceCreamTune = "A little music-box tune drifts down the road.",
	Thunder = "Thunder rolls somewhere far off.",
	RareHum = "The air feels a little different tonight.",
	Horn = "A horn honks twice, cheerfully, somewhere down the road.",
}

return Text
