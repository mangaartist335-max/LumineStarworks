#!/usr/bin/env python3
"""Generates pages 6-55 of the Eden ep1 thread + updates pagination on all pages."""
import os, re, random
from datetime import datetime, timedelta

random.seed(42)
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
TOTAL_PAGES = 56
TOTAL_POSTS = 1113

# ============================================================
# USER POOL - returning users carry their avatar/rank consistently
# ============================================================
RETURNING_USERS = [
    {"name": "xXSoraGauthier_KunXx", "av": "av-starcircuit", "rank": "Anime Addict", "joined": "Jul 2011", "posts_base": 1353},
    {"name": "NekoToast92", "av": "av-nekotoast", "rank": "Forum Regular", "joined": "Mar 2010", "posts_base": 892},
    {"name": "NodeCorePilot", "av": "av-mecharonin", "rank": "Senior Member", "joined": "Aug 2010", "posts_base": 2205},
    {"name": "PlanetationBro", "av": "av-bluesoda", "rank": "Senior Member", "joined": "Feb 2010", "posts_base": 1914},
    {"name": "ShounenLifer_VHS", "av": "av-vhssamurai", "rank": "Anime Addict", "joined": "Apr 2009", "posts_base": 4191},
    {"name": "GraysonSus_NotSus", "av": "av-kiranotkira", "rank": "Forum Regular", "joined": "Sep 2011", "posts_base": 616},
    {"name": "PlanetationKid", "av": "av-planetkid", "rank": "Newbie", "joined": "Sep 2013", "posts_base": 34},
    {"name": "BurstAnimKid", "av": "av-luckynoodle", "rank": "Member", "joined": "Jan 2012", "posts_base": 251},
    {"name": "3EpisodeRule", "av": "av-3eprule", "rank": "Senior Member", "joined": "Apr 2010", "posts_base": 1517},
    {"name": "likko-chwangun213", "av": "av-sakurastatic", "rank": "Forum Regular", "joined": "Jun 2011", "posts_base": 731},
    {"name": "SakugaThreadZero", "av": "av-zeroframe", "rank": "Database Contributor", "joined": "Nov 2009", "posts_base": 5891},
    {"name": "ImageboardGoblin", "av": "av-forumgoblin", "rank": "Member", "joined": "Aug 2012", "posts_base": 422},
    {"name": "NovaFanPixel", "av": "av-moonlitpixel", "rank": "Database Contributor", "joined": "Mar 2010", "posts_base": 6214},
    {"name": "AbigailFanAlready", "av": "av-abigailfan", "rank": "Member", "joined": "May 2012", "posts_base": 504},
    {"name": "TokuFanMango", "av": "av-robomango", "rank": "Forum Regular", "joined": "Feb 2011", "posts_base": 911},
    {"name": "KaichouEnjoyer", "av": "av-kaichouenjoyer", "rank": "Anime Addict", "joined": "Aug 2011", "posts_base": 2127},
    {"name": "sleepySenpai_DesuKa", "av": "av-sleepysenpai", "rank": "Member", "joined": "Apr 2012", "posts_base": 388},
    {"name": "CalibrationLunchbox", "av": "av-cyberlunchbox", "rank": "Member", "joined": "Aug 2013", "posts_base": 91},
    {"name": "HollowToast", "av": "av-hollowtoast", "rank": "Senior Member", "joined": "Jul 2010", "posts_base": 2452},
    {"name": "RetroBluRay_AMV", "av": "av-retrobluray", "rank": "Forum Regular", "joined": "Aug 2010", "posts_base": 1424},
    {"name": "StormWallTheory", "av": "av-stormwalltheory", "rank": "Senior Member", "joined": "Jan 2010", "posts_base": 3026},
    {"name": "HirotoHiro53", "av": "av-sorawatcher", "rank": "Newbie", "joined": "Oct 2013", "posts_base": 22},
    {"name": "ChibiComet_92", "av": "av-chibicomet", "rank": "Forum Regular", "joined": "May 2011", "posts_base": 1103},
    {"name": "FinalBossu", "av": "av-finalbossu", "rank": "Anime Addict", "joined": "Feb 2010", "posts_base": 4002},
    {"name": "MillenniumAnimeFan2001", "av": "av-millenniumfan", "rank": "Newbie", "joined": "Sep 2013", "posts_base": 52},
    {"name": "Eden_Day01", "av": "av-day01", "rank": "Member", "joined": "Jul 2012", "posts_base": 307},
    {"name": "RawrXD_2007", "av": "av-rawrxd", "rank": "Member", "joined": "Mar 2013", "posts_base": 192},
    {"name": "ToonblockKid", "av": "av-toonblock", "rank": "Forum Regular", "joined": "Apr 2011", "posts_base": 644},
    {"name": "HyperNekoMimi", "av": "av-hyperneko", "rank": "Forum Regular", "joined": "Nov 2011", "posts_base": 492},
    {"name": "ShadowToast", "av": "av-shadowtoast", "rank": "Member", "joined": "Jun 2013", "posts_base": 132},
    {"name": "HellsKitchenAnimu", "av": "av-kitchenstar", "rank": "Forum Regular", "joined": "Aug 2012", "posts_base": 538},
    {"name": "GoldenSloth_Animu", "av": "av-goldensloth", "rank": "Newbie", "joined": "Oct 2013", "posts_base": 5},
    {"name": "NodeCoreOmega", "av": "av-nodeomega", "rank": "Senior Member", "joined": "Dec 2009", "posts_base": 2890},
    {"name": "DrowsyGhostVHS", "av": "av-drowsyvhs", "rank": "Member", "joined": "Feb 2012", "posts_base": 421},
    {"name": "VermilionOwl_AniFan", "av": "av-vermilionowl", "rank": "Member", "joined": "Sep 2012", "posts_base": 411},
    {"name": "CipherCaramel_Cyberpunk", "av": "av-ciphercaramel", "rank": "Member", "joined": "Aug 2012", "posts_base": 261},
    {"name": "CalibrationSparrow88", "av": "av-calsparrow", "rank": "Forum Regular", "joined": "May 2010", "posts_base": 1022},
    {"name": "BostonBaka_Gaijin", "av": "av-bostonbean", "rank": "Member", "joined": "Jun 2012", "posts_base": 308},
    {"name": "OkamotoAcolyte", "av": "av-okamoto", "rank": "Forum Regular", "joined": "Mar 2011", "posts_base": 1114},
    {"name": "Kappa_Zero_Yokai", "av": "av-kappazero", "rank": "Member", "joined": "Feb 2012", "posts_base": 344},
]

# One-time / occasional new posters - parody handles using ONLY:
#   1) In-universe Eden references (characters, orgs, terminology from the show)
#   2) Generic anime culture / tropes (no specific franchise borrowed)
#   3) 2010s otaku forum/scene culture
NEWBIE_NAMES = [
    # In-universe Eden character stans
    "Sora_Gauthier_Stan", "SoraNumberOne", "MiyukiKagemitsuStan", "MiyukiSpeechLifer",
    "AbigailJuneEnjoyer", "AbigailSakugaLover", "GraysonGuarding", "GraysonSusEvidence",
    "Ben_Smythe_Cousin", "BenChairThrower", "EchoDesmondStan", "DesmondJonesAtsushi",
    "GamletCoffee", "Nova_FRM_Stan", "WilliamJonesFan", "KieranAtsushiFan",
    "LikkoHammondCouncil",
    # In-universe Eden setting / org references
    "PlanetationDayOne", "BurstAnimDebutHype", "NodeCoreCollector", "MetaCodeArmFan",
    "FRM_Recruit", "FRM_Alumni", "HammondMiddleAcademy", "HammondAcademyDropout",
    "KO_DroneRecruit", "KO_Tier3_Suspect", "YAMAGA284_Survivor", "YAMAGA_Cousin",
    "VoidRiftSurvivor", "ForceReadingTutor", "PlanetationLag", "RedactedTagHype",
    "CalibrationCard_42", "Eden_Stan", "EdenStan", "EpisodeOneOnLoop",
    "ColdOpenBabyFan", "RooftopMonologueLifer", "StormConnectionTheory", "WorldTreePulse",
    "HammondCouncilStan", "BurstStudioCult", "BurstStepFan", "MetaCodeChargeFan",
    # Generic anime tropes / culture (no specific franchise)
    "TsundereWranger", "TruckKun_Driver", "TruckKun_Survivor", "IsekaiVacancyClerk",
    "IsekaiSurvivorKun", "TrappedInGameTM", "WaifuTaxIntern", "SubsOverDubs4Life",
    "HareemAnxiety", "MagicalGirlMidlife", "MagicalGirlOnHiatus", "MahouShoujoLifer",
    "BattleShounenLifer", "ShounenProtagSus", "ShounenHairFan", "NekoMimi_Sensei",
    "MoeMoeKyun_v2", "FigmaCollector_Eternal", "AnimeJacket_Dad", "AnimeMomFanboy",
    "OtakuTaxAccountant", "GenericIsekaiMC", "ProtagPlotArmor", "FillerEpisodeFan",
    "OPSkipperKun", "EDSkipperKun", "SubGoblin",
    # 2010s otaku scene / forum culture
    "xXSenpaiNoticeMeXx", "xXShounenMC_KunXx", "xXTsundereChanXx", "xXBakaSenseiXx",
    "MoshiMoshi_2007", "RawrXD_Forever", "SugoiAniLover", "DesuKawaii_92",
    "AMV_NoCopyright", "AMV_HighlandJump", "AnimuSensei_92", "BakaGaijin_Yes",
    "AnoneAnoneAnone", "NaniDaFugu", "SenpaiKohaiLifer", "KawaiiDesuNe",
    "OldSenseiKnees", "OldManManga_v2", "PinkLemon_AMV", "DakimakuraTaxLifer",
    # Generic newbie / lurker / guest accounts
    "GuestUser_3014", "GuestUser_8821", "GuestUser_5527", "FirstTimePosting",
    "ImNotASpambot", "Anon42", "Anon_2013", "QuickQuestion", "JustHereForOPs",
    "Senpai_Notes", "SunnyEgg_Anime", "BadEnding_Fan", "RawStreamRider",
    "WhenSubs_Question", "AnimeNewToMe", "FreshOctober2013", "OneEpisodeIn",
    "TS_HunterKun", "BroadcastRipPreserver",
    # Parody network / service handles
    "ToonblockEnjoyer", "ToonblockGraveyard1AM", "MunchyRollSubsOnly",
    "MunchyRollLagger", "AdultDriftWatcher", "FunmaxationDubWaiter",
    "AniBlexCommittee_Fan", "AniWireRefresher", "TooncastChild_2003",
    "ToonblockHostStan",
]

# ============================================================
# AVATAR POOL for newbies - varied oddball icons, no generic placeholders
# ============================================================
NEWBIE_AVATARS = [
    "av-nekotoast", "av-luckynoodle", "av-robomango", "av-sakurastatic",
    "av-cyberlunchbox", "av-zeroframe", "av-moonlitpixel", "av-3eprule",
    "av-millenniumfan", "av-day01", "av-rawrxd", "av-toonblock",
    "av-hyperneko", "av-shadowtoast", "av-kitchenstar", "av-goldensloth",
    "av-nodeomega", "av-drowsyvhs", "av-vermilionowl", "av-ciphercaramel",
    "av-calsparrow", "av-bostonbean", "av-okamoto", "av-kappazero",
    "av-guestfirework", "av-guestink", "av-guestcone", "av-guestsignal",
]

RANK_POOL = ["Newbie", "Newbie", "Newbie", "Member", "Member", "Forum Regular", "Senior Member"]
JOINED_POOL = ["Oct 2013", "Sep 2013", "Aug 2013", "Jun 2013", "Mar 2013", "Nov 2012", "Aug 2012",
               "Apr 2012", "Jan 2012", "Sep 2011", "Mar 2011", "Sep 2010", "Feb 2010"]

# ============================================================
# CONTENT POOLS - episode-specific references
# ============================================================
SCENES = [
    "the rooftop monologue", "the YAMAGA284 fight", "the cold open", "the school riot",
    "the train station banter", "the lobby weapon reveal", "Miyuki's Void Rift speech",
    "the calibration scene", "Grayson's flaming dual blades", "Abigail's grapple finisher",
    "Ben disabling his NodeCore safety governors", "the vending machine UI joke",
    "the homeroom teacher SYSTEM OVERRIDE moment", "Sora's burst step through YAMAGA's blind spot",
    "Likko's emote-spam in the lobby", "Echo doing parkour while testing dual blades",
    "the Gamlet/Nova coffee + honey scene", "the storm reveal at KO HQ",
    "the baby pressing the glass at the end", "the OP playing at the very end",
    "the Hammond Middle Academy propaganda posters", "the bottle riot scene",
    '"Out here everything\'s just... wait."', '"I hate later."',
    '"Don\'t die out there, okay?" / "I won\'t."', '"...Barbaracy?"',
    '"Kiss my ass, German bastard!!!"', '"Finally! We can make love to each other!"',
    '"Those pigs can have whatever\'s left."', '"What would the heroes do?"',
    "the bleed when YAMAGA cuts Sora", "the YAMAGA READ LEVEL UI dropping from 100% to 30%",
    "the colorblind shockwave inversion in the cold open", "Sora's skateboard ride home",
    "Miyuki's booming end-of-lobby speech",
    "the full YAMAGA284 fight choreography",
    "Abigail's mid-air grapple-launch finisher",
    "YAMAGA284's silent head tilt at 30% READ LEVEL",
    "Burst's debut animation showcase in the YAMAGA fight",
    "the MetaCode arm-charge sakuga before the burst step",
    "Sora's MetaCode transforming mid-charge",
    'Miyuki\'s "our choice towards history is refusal" line',
    'Miyuki\'s "advance to crush them" line',
]

CHARACTERS = (
    ["Sora"] * 5 + ["Grayson"] * 5 + ["Abigail"] * 6 + ["Ben"] * 4 +
    ["Miyuki"] * 5 + ["Likko"] * 3 + ["Echo"] * 2 +
    ["Gamlet"] * 2 + ["Nova"] * 2 + ["Lisa"] + ["Sarah"]
)

THEORIES = [
    "the storm being Sora himself somehow",
    "Grayson being season 1's traitor",
    "the school being the real simulation, not Planetation",
    "the baby in the egg being a young Sora",
    "Frontier Risk Management being the ep 2 plotline",
    "KO having clearance over our protagonists already",
    "YAMAGA284 being a real human integrated into the game",
    "Miyuki's council squad being levels above our crew",
    "Gamlet and Nova being secretly married",
    "the storm and the World Tree pulse being connected",
    "the cold open being set in 2007, eleven years before the show's present",
    "the chromatic inversion meaning the cold open is the same world from a different angle",
    "Nova knowing more than she's letting on at KO HQ",
    "the redacted KO-tier 3 tag flashing on Grayson's calibration card",
]

JOKES = [
    "Ben kicking down a trashcan in the first 6 minutes for absolutely no reason",
    "the toaster forum joke (NekoToast/HollowToast/ShadowToast)",
    "Abigail being the only sane person in the squad",
    "Ben yelling \"What would the heroes do?\" mid-riot",
    "RoboMango's 'this is so 2010s mecha-coded' take",
    "the vending machine taking zero damage in the combat log",
    "Ben simping for Echo on the same train ride Sora confesses he likes Miyuki",
]

ENERGY_REACTIONS_SHORT = [
    "lol", "lmao", "rofl", "XD", ":D", ":P", "T_T", ";_;", "O_O", "o_o",
    ":3", "x_x", ":ooo", "wild", "feels", "all the feels", "TFW",
    "epic", "iconic", "ridiculous", "this", "no thoughts head empty", "yes",
]

# ============================================================
# POST CONTENT TEMPLATES (simple, natural 2013 viewer reactions)
# ============================================================
SHORT_ONE_LINERS = [
    "Holy crap, the YAMAGA fight animation was incredible! Studio Burst went all out XD",
    "Abigail is best girl this season hands down. Her flame guns is so cool <3",
    "Miyuki's speech at the end... Saori Hayami's voice gave me chills o_O",
    "Ben disabling his NodeCore safety limits within 30 seconds of getting it is hilarious LOL",
    "Wait, why did the OP play at the END of the episode? Was that a special premiere thing?",
    "Sora's 'I hate later' rooftop line hit me right in the feels ;_;",
    "The cold open with the blue egg and the baby under the World Tree was so creepy!!",
    "Grayson using dual greatswords with remote ignition mode was badass >_>",
    "Echo doing parkour off the walls in the lobby... character designs in this show are top tier =3=",
    "Sora getting cut on the shoulder and shouting 'fight me harder!'... scrappy protag energy!",
    "Hiroyuki Sawano's OST during the lobby scene is an instant playlist add!",
    "Sub over dub as always! Can't wait for ep 2 next week!",
    "That YAMAGA monster is genuinely terrifying. Tutorial boss of the year LOL",
    "Rewatched the YAMAGA fight 3 times already... Sakuga of the season!",
    "Ben kicking a trashcan in the first 6 minutes for zero reason had me dying XDD",
]

MEDIUM_POSTS = [
    "Just finished Episode 1! I thought this was gonna be a basic VR school anime, but the ending went full nightmare mode XD When YAMAGA284 appeared and the READ LEVEL started dropping, the atmosphere turned so intense. Fall season is saved!",
    "Abigail aiming her dual flame gunss with that totally unbothered expression made her my favorite character immediately. She's the only sane person in Sora's squad lol. Can't wait to see her fight more in Ep 2!",
    "The animation in the YAMAGA fight was insane for a premiere. Studio Burst's debut is showing off so hard! The way Sora uses the MetaCode arm-charge to burst-step through YAMAGA's blind spot was peak hype.",
    "My current theory for the show: the storm in Planetation isn't just an in-game weather hazard, it's connected to the blue egg from the cold open. The World Tree pulse in the opening scene was definitely a warning sign o_O",
    "Miyuki Kagemitsu has only been on screen for 4 minutes and she already gave the most intimidating speech of the season. 'Restrictions behind history are merely an excuse to refuse living!' Saori Hayami delivered that line with pure authority <3",
    "Mariya Ise as Sora is such a good casting choice! Sora sounds genuinely 12 without being annoying, and his energy during the fight scene felt so scrappy and real. 10/10 voice work.",
]

LONG_POSTS = [
    "Rewatched Episode 1 with friends tonight. The pacing in this premiere is so well done:<br><br>1. The cold open immediately sets up a creepy mystery with the blue egg under the World Tree.<br>2. The school and lobby scenes introduce the main crew (Sora, Grayson, Abigail, Ben) naturally without long boring info-dumps.<br>3. The YAMAGA284 fight delivers top-tier action sakuga, and Miyuki's speech at the end sets up the stakes for the whole show.<br><br>Easily one of the best premiere episodes of 2013!",
    "A few thoughts on Episode 1 after my second watch:<br><br>- The weapon designs are amazing. Grayson using twin Crucible greatswords to herd YAMAGA into Sora's attack path was brilliant squad tactics.<br>- Ben is pure comedic relief, disabling his safety governors immediately XD<br>- Studio Burst's animation and sound design in the lobby scene was so atmospheric.<br><br>Bring on Episode 2 next Sunday!",
]

# ============================================================
# HYPE POSTS - dedicated templates for the SIX big ep1 hype topics
# (Miyuki speech, Burst animation, YAMAGA nightmare fuel, Grayson fight,
#  Abigail sakuga, Sora fight). These get oversampled on peak-hype pages.
# ============================================================
HYPE_POSTS_MIYUKI_SPEECH = [
    "Miyuki's end-of-lobby speech is doing things to me. when the music drops out and her voice just BOOMS through the lobby? Saori Hayami pulled the absolute most. \"No fear, no hesitation, no regrets!\" delivered in a register I didn't know she had. class president of all time.",
    "okay the BOOMING in Miyuki's speech is what gets me. it's not loud. it's like the room got smaller around her. that's mixing + VA performance + framing all hitting at the same time. an 8-second speech doing the work of an entire mid-season arc speech. \"If the walls above stand in front of you, advance to crush them!\" &mdash; in a LOBBY. before any boss. before any fight.",
    "Miyuki's speech going from controlled to BOOMING and then ending on the smug \"so is grass green then?\" Void Rift line is ep 1 character work I'll be thinking about for weeks. the show is telling us EXACTLY who she is and we're listening.",
    "rewatched Miyuki's speech four times. that bass-drop of silence when she pauses, then her voice swelling up underneath the line, then Echo/Likko/Kieran/William all confirming Void Rift one by one while their player-icons turn red &mdash; that's a sequence. the WHOLE thing is a sequence. choir energy.",
    "Miyuki Kagemitsu has been on screen for less than 4 minutes total and already has the most intimidating booming speech of the season. how. HOW. Hayami carrying this character into legend already.",
    "\"Restrictions behind history are merely an excuse to refuse living!\" &mdash; Miyuki, in a TUTORIAL LOBBY, in a kid's VR game, in episode 1. who let them write that. who let her DELIVER it. that's a season finale line and it's right there in the premiere.",
    "the way Miyuki's speech ends on \"<i>our choice towards history is refusal!</i>\" and then the lobby goes DEAD silent and you realize her squad already knew the speech was coming. they're not even reacting. that's a class president who has DRILLED this. unreal foreshadowing density.",
    "the BOOMING. the BOOMING in that speech. \"That is the real truth of humanity!\" lands like a hammer because the room is built around her at that moment. Hayami hitting a register that I genuinely didn't think she had. somebody nominate her for VA of the year already.",
    "look I keep coming back to the structure of Miyuki's speech: it goes <i>fear</i> &rarr; <i>walls</i> &rarr; <i>restrictions</i> &rarr; <i>truth</i> &rarr; <i>choice</i> &rarr; <i>refusal</i>. that's not a speech, that's a thesis statement for the WHOLE SHOW. ep 1 is dropping the show's central theme inside a 25-second monologue and trusting you to remember it.",
]

HYPE_POSTS_BURST_ANIM = [
    "ANIMATION POST. I want to say this cleanly: this is some of the best looking ep 1 animation I've seen in years. silhouette readability in the YAMAGA fight, camera that behaves like an animator's camera (cuts on emotion not coverage), comp work where the lobby UI bleeds into the action layers cleanly &mdash; that's not 'good for ep 1', that's just GOOD. and Burst is a DEBUT studio. unhinged.",
    "Burst's animation in this ep is genuinely unfair. you can pause on almost any frame and it reads. the lobby weapon-reveal alone has more clean silhouettes than entire arcs of other shows. layout is doing massive work. Okado's <i>Neon Afterimage</i> training is showing.",
    "the Burst animation across the fight scenes is doing the WIT-style cinematic thing without ever getting muddy. you always know where everyone is, what direction they're moving, and what they want. that's not flash, that's craft.",
    "okay I'm just going to keep saying it: the animation is THIS good in EP 1. when veteran sakuga heads start posting screenshot threads tomorrow you're all going to remember I called it first. Burst is the studio of the year and it's their DEBUT.",
    "Burst earning their stripes scene by scene this ep:<br>- weapon reveal: clean silhouette work<br>- school chaos: camera blocking that doesn't lose anyone<br>- YAMAGA fight: full sakuga showcase<br>- KO HQ: comp work that sells weight without flash<br>- Miyuki's speech: framing + held poses<br>that is FOUR different animation modes pulled off in 22 minutes. how.",
]

HYPE_POSTS_YAMAGA_NIGHTMARE = [
    "YAMAGA284 is genuinely scary. for a 'tutorial boss' he is way too unsettling. the BLANK face. the way he doesn't make NOISE when he moves, just appears. the READ LEVEL ticking down isn't just power-scaling, it's the show telling you he's LEARNING you in real time. that is not how a normal game boss works. that's a horror enemy.",
    "the moment YAMAGA tilts his head a quarter inch when Sora burst-steps through his blind spot and the READ LEVEL drops to 30%? I stood up. that head tilt is doing more characterization than entire seasons of villains in other shows. nightmare fuel.",
    "YAMAGA284 nightmare fuel ranking for tutorial bosses: top tier of all time. not joking. the silence + the blank face + the LEARNING UI + the way the bleed when he cuts Sora is just real-looking and not stylized? that's a horror movie hiding inside a shounen ep 1.",
    "'beginner trial' my entire ass. YAMAGA is faceless body horror in a fight that's supposed to introduce mechanics. nobody designs a tutorial boss like that unless they want you SCARED of what's coming next. Burst really said 'welcome to the show, here's a permanent face you'll see in your dreams.'",
    "the thing about YAMAGA being nightmare fuel is that he's not even doing horror movie poses. he's doing FIGHT poses. he just happens to look wrong while doing them. that's a much harder design problem and Burst NAILED it on a debut. evil.",
]

HYPE_POSTS_GRAYSON_FIGHT = [
    "Grayson's fight on YAMAGA is PEAK. opens with him CALMLY igniting Crucible Dual Blades &mdash; no shouting, no power-up, just \"Crucible Dual Blades, online\" like he's reading the weather. one blade circles HIGH like a predator wing, the other carves LOW. that's not attacking, that's HERDING YAMAGA into bad footing for Sora. and the IGNITION mode heat-haze warping the camera frame? insane comp. PEAK.",
    "the Grayson sequence is doing the smartest thing in the fight: he's not fighting YAMAGA, he's CONTROLLING the space around him so Sora can. that's a support character carrying himself like a lead. the way the dual blades arc independently of each other &mdash; one circling, one carving &mdash; is the kind of choreography you only get when the Action Director (Kagura per the BD listing) has done squad-tactics shows before.",
    "Grayson's choreography on YAMAGA is the most efficient action work in the episode. zero wasted motion. every blade pass changes YAMAGA's footing. he doesn't even land the kill, he steps BACK and lets Sora take it. that's a character beat AND a fight beat at the same time. peak.",
    "Grayson's Crucible Dual Blades sequence: top 3 ep 1 fight beats of the year already. the IGNITION color-shift, the dual-orbit pattern, the calm voiceline, the way the camera lingers on him for one beat after he disengages so you remember he's the threat. peak character introduction PEAK fight peak everything.",
    "I'm going to keep posting until everyone agrees: Grayson's fight on YAMAGA is the best individual fight contribution in any ep 1 this year. he doesn't 'win' the fight. he MANAGES it. and the show frames him doing it like a chess player. that's a lead-tier fight beat in a side character's first action scene.",
]

HYPE_POSTS_ABIGAIL_SAKUGA = [
    "ABIGAIL SAKUGA APPRECIATION POST. the moment after Sora softens YAMAGA up. wait for the music cue. then Abigail comes IN FROM OFFSCREEN with the Flame Guns grapple, fires both pistols at angle while still mid-air, slams the grapple anchor into YAMAGA's shoulder, swings UP, lands ON him, finishes him with the flame guns at point blank &mdash; ENTIRE move, one continuous unbroken cut. that's hand-animated 'studio shows off' frames. Burst really said 'we're new, here's our resume.' freeze any frame, all of them read.",
    "the Abigail mid-air grapple finisher is sakuga in its purest form. one cut. zero cheat-cuts. arms, weapon, grapple, environment, YAMAGA's body all moving in correct relative space the entire time. that's not an action scene, that's a dance number, and only ONE animator gets to put their name on it.",
    "Abigail's sakuga launch on YAMAGA is the moment the episode goes from 'oh this is good' to 'OH this is GOOD.' the smoothness is unreal. the anticipation pose into the offscreen launch into the grapple-anchor lock is timed PERFECTLY to the music cue. that's a sakuga animator AND an action director AND a sound director all in lockstep.",
    "okay one more Abigail sakuga post. the smear-frame on the swing-up. the way her hair physics actually settle for ONE beat at the apex of the swing before falling back down. the flame guns firing at near-contact range without losing readability. a single cut doing the work of 5 cuts. peak.",
    "the Abigail finisher is a flex move and Burst is allowed to flex on a debut. fan animator credits on this scene are going to be a who's-who of the indie sakuga scene. mark it. screenshot threads incoming all week.",
]

HYPE_POSTS_SORA_FIGHT = [
    "Sora carrying the YAMAGA fight is exactly what an ep 1 protag needs to do but it's HOW he does it that sells me. he's NOT outfighting YAMAGA. he's outsmarting him. burst-step into the blind spot the SECOND he realizes the READ LEVEL is 100% &mdash; that's a kid noticing the UI in real time. when he gets cut and the bleed actually shows on his model? that lands because it's not stylized. it's just a kid who got cut.",
    "Sora's full fight against YAMAGA is the most efficient ep 1 protag fight I've seen in years. he uses the burst-step ONCE, intelligently. he loses the next exchange. he gets cut. he gets back up. he yells. he sets up Grayson's herding pattern. he sets up Abigail's finisher. he TAKES the kill. that's a character arc inside a fight. inside ep 1.",
    "the way Sora's 'AAARRGGHHHH!!!' charge after softening YAMAGA up should be cringe but Mariya Ise's delivery makes it hit. you can hear the exhaustion underneath the rage. that's not a power-up scream, that's a kid who's already tired and forcing himself to keep going. ep 1 protag delivery of the year.",
    "Sora's fight against YAMAGA is character work disguised as choreo. every move he makes tells you something about him: he watches the UI (smart), he goes for the blind spot (creative), he gets cut (mortal), he yells (emotional), he doesn't celebrate the kill (humble). 4 minutes of fight = 4 minutes of writing.",
    "the Sora vs YAMAGA fight is going on the ep 1 highlight reel of the year. period. the entire fight is built to make you trust him as a protag &mdash; and it works because Burst shows you his decisions in real time. he's not 'just strong.' he's THINKING. you can see him thinking. peak.",
]

HYPE_POSTS_METACODE_BURST = [
    "METACODE CHARGE SAKUGA POST. the moment everyone needs to rewatch frame by frame: Sora's arm BREAKS into MetaCode mode, plates flicker, the energy charge winds up the forearm in spirals, then the whole thing FIRES into the burst step. that is hand-animated, that is single-animator-shows-off frames, and the smear-frame on the launch alone is going on screenshot threads for the rest of the year.",
    "the MetaCode charge before Sora's burst step is sakuga. plain and simple. you get the plate-shift transformation, the spiraling energy ramp up the arm, the eye flick when his focus locks on YAMAGA's blind spot, and THEN the burst step launches and the camera doesn't even try to follow it &mdash; it just smears. that's an animator going \"I want this one\" and the studio saying yes.",
    "okay so when Sora's MetaCode charges before the burst step, watch the BACKGROUND. the floor textures distort in a half-circle around him. that's a custom FX layer. for one move. in EP 1. Burst really hand-rolled bespoke FX for a single animation beat. that's a flex move and I respect it.",
    "Sora's MetaCode transformation + charge + burst step is a 30-frame sequence and I have rewatched it like 50 times. the way the plates on the forearm shift INWARD before the energy spirals OUTWARD is the kind of mechanical detail you only get when the character designer (Haraguchi) and the FX AD (Morozumi) actually talk to each other.",
    "the burst step itself is good but the CHARGE up to it is the sakuga moment. the MetaCode plates breaking apart, the inner glow building, Sora's stance dropping low, the camera tightening on his arm for one extra frame &mdash; that's all anticipation animation, and it's the reason the burst step lands as hard as it does. anticipation is half of sakuga and Burst gets it.",
]

HYPE_POSTS_VA_RECOGNITION = [
    "@OkamotoAcolyte you're right and the way you laid it out broke my brain. <b>Rina Satou as Echo Desmond. Hiro Shimono as William Jones. Hiroshi Kamiya as Kieran Atsushi. Ayane Sakura as Likko Valenne.</b> Hammond Council 1 is fully stacked. I went back to the lobby scene and Echo's \"confirmed Void Rift\" line is unmistakably Satou once you know to listen for it. <b>DOES KAIHATSU MIURA-SAN KNOW</b> what he assembled here?",
    "the lineup is officially insane. read it again: Saori Hayami + Rina Satou + Hiro Shimono + Hiroshi Kamiya + Ayane Sakura. all FIVE in <b>one school council squad</b> in <b>episode 1</b> of a <b>debut studio</b>. <b>AM I HEARING SOMETHING!?!?!?!</b> someone tell me this isn't a fever dream. that's a cast you'd see headlining a major mid-season blockbuster, not a debut studio's premiere.",
    "<b>Hiroshi Kamiya as Kieran Atsushi???</b> Kieran has like four lines in the whole episode. four. Kamiya. on a Hammond Council 1 advisor with FOUR LINES. Burst is hoarding their best toys. when Kieran Atsushi finally gets a real scene we are going to GO OFF.",
    "VA detective check-in: confirmed via the AniWire listing that Hammond Council 1 is <b>Saori Hayami</b> (Miyuki, President), <b>Rina Satou</b> (Echo Desmond, VP), <b>Hiro Shimono</b> (William Jones, Supervisor), <b>Hiroshi Kamiya</b> (Kieran Atsushi, Advisor), and <b>Ayane Sakura</b> (Likko Valenne, Secretary). plus Gamlet/Nova in FRM are Kishou Taniyama and Yui Ishikawa as we already knew. that's a five-voice ensemble of S-tier talent in ONE squad. <b>DOES KAIHATSU MIURA-SAN KNOW WHAT HE HAS HERE.</b>",
    "ok I had to sit down. <b>Hiro Shimono is William Jones.</b> William's the supervisor kid with the headset. one of Miyuki's quieter squad members. Shimono. on a quiet supervisor role. the show is going to give him ONE big yell scene later in the season and the whole forum is going to combust.",
    "Echo Desmond's lines in the lobby are short but listen with headphones. that controlled <i>\"confirmed. Void Rift.\"</i> &mdash; it's weighted, it's certain, and it's clearly <b>Rina Satou</b>. casting Satou as Miyuki's right-hand is a setup for them to share a scene later that we're going to cry about. mark this post.",
    "can we talk about how this means Saori Hayami is the LEAD of an ensemble where her four squadmates are Rina Satou, Hiro Shimono, Hiroshi Kamiya, AND Ayane Sakura. Hayami has to <i>carry</i> a squad of those four. that's not casting, that's a casting <b>statement</b>. <b>AM I HEARING SOMETHING!?!?!?!</b>",
    "I want to be normal about this and I cannot. <b>Kamiya as Kieran Atsushi</b> means Kieran's going to have a Big Moment later in the season. Kamiya doesn't show up in 4-line advisor roles for nothing. Burst is BANKING him for a payoff cut. the slow burn is real and it starts in ep 1.",
    "@OkamotoAcolyte the part of your post I keep coming back to is \"the show is HOARDING firepower for later episodes.\" because YES. you don't put Satou + Shimono + Kamiya + Sakura in a squad in ep 1 and not give that squad a 2-episode arc later. somebody put me in cryo until those episodes air.",
    "look at the math: 5 named Hammond Council 1 members (Miyuki + Echo + William + Kieran + Likko) + Nova + Gamlet = SEVEN confirmed S-tier VAs in episode 1. SEVEN. for a debut studio. the BD credits dropping is going to be a forum-wide event. <b>DOES KAIHATSU MIURA-SAN KNOW.</b> does he KNOW. somebody get a reaction quote.",
    "side note can we talk about the surname structure? Echo <b>Desmond</b>, William <b>Jones</b>, Kieran <b>Atsushi</b>, Likko <b>Valenne</b>. the show is going full international-academy on the naming. Kagemitsu is JP, Desmond is EN-coded, Jones is EN-coded, Atsushi-as-surname is unusual JP, Valenne is FR-coded.",
    "<b>AYANE SAKURA AS LIKKO VALENNE???</b> Likko has the most emote-spam energy of the entire Council and now I know why. Sakura on a chaos-coded secretary role. she's gonna BLOW the lid off later. mark my words. Likko is the dark horse of this ensemble.",
    "wait wait wait. <b>Michael Pentulengro is Yoshimasa Hosoya</b> and <b>Andreas Walker is Tasuku Hatanaka.</b> they're listed as side cast but those are NOT side-cast voice actors. that is a Setup. you don't cast Hosoya on \"side character\" unless you're planning a midseason promotion arc. Burst loading the BENCH with S-tier voices is some next-level long-game writing.",
    "Likko Valenne is the secretary of Hammond Council 1 and she's voiced by <b>Ayane Sakura</b>. just say that out loud. Ayane Sakura. on Council 1. with Hayami, Satou, Shimono, and Kamiya. they put FIVE elite VAs in one squad. there is no way this is an accident. somebody at Burst made this casting call on purpose and we are going to feel it in episode 4 or whenever the Council finally gets a real arc.",
]

HYPE_POSTS_GIRLS_ANIMATION = [
    "I need to talk about how the GIRLS are animated in this episode because nobody is talking about it enough. Burst gave every single woman in the cast extra in-between frames, custom color/lighting passes for quiet beats, and ZERO fan-service framing. that's not by accident. that's <b>Natsuki Takuya's</b> philosophy from the manga translated to motion. women as people first, archetypes second, decoration zero percent of the time. drag this post if I'm wrong but rewatch the lobby first.",
    "Abigail's grapple finisher on YAMAGA284 is the headline sakuga, but please notice WHAT they animated inside it: the necklace pendant clutch mid-fall, the bad landing roll, the flame guns blade glow custom-toned to gold-orange (Grayson's is red-orange &mdash; they color-coded the boys and girls separately on purpose). nobody draws a personal gesture INSIDE a kill cam unless they respect the character as a person. Burst respects Abigail. Takuya's manga respects Abigail. they kept it.",
    "the Miyuki speech animation is doing the OPPOSITE of what 99% of 2013 shows would do. no push-in, no low-up shot, no hype-cuts. just a wide hold with her hair animated separately against the data tower wind and a 2-3 pixel-per-second downward camera drift over 8 seconds. that's a HAND-DRAWN camera move done with care. that's a key animator saying \"stillness is the character.\" exactly how <b>Natsuki Takuya</b> draws her in the manga.",
    "Nova's animation is sneaky-incredible. she walks in carrying coffee. that's the setup. and Burst animated her SHOULDERS dropping by like 1-2 pixels when she looks at the player counter ticking down. they drew exhaustion into her POSTURE, not her dialogue. then Yui Ishikawa delivers \"It's over\" flat and Burst doesn't even cut to a reaction. they trust the audience. that's Takuya's whole approach to writing women: emotional weight in the body, not in the lines.",
    "Likko Valenne's lobby cameo is FOUR SECONDS LONG and Burst gave it a full key-frame pass with five separately-animated NPCs matching her emote rhythm instead of loop-recycling the crowd. that's a hand-drawn crowd reaction for a 4-second comedic beat. that's the studio going \"Likko's chaos energy is part of her character, we're not going to deflate it for a budget shortcut.\" exactly how Takuya draws her in the manga. Ayane Sakura's energy got into the LINES.",
    "Echo Desmond is animated entirely in motion. her whole lobby intro is parkour between two training rails while testing dual blades. she NEVER stops moving. and the parkour is drawn cleanly &mdash; real weight transfer, real momentum, no impossible mid-air poses to make her look graceful. she's drawn like an athlete. that's Takuya writing women with bodies that actually function, not bodies posed for the camera.",
    "compare how Burst draws the girls vs. how a generic 2013 action anime would have drawn them. Abigail's finisher would have had a low-angle skirt shot during the air rotation. Miyuki's speech would have had a low-up shot to make her \"intimidating.\" Nova's tired sigh would have had a chest-pant hold. Echo's parkour would have had impossible mid-air spins. Burst drew the EXACT OPPOSITE of all of that, deliberately. the camera respects every woman in the episode even when they're in motion. that's the Takuya filter applied at the storyboard level.",
    "I want to make sure people understand what a custom color pass means. Grayson's Crucible Blades glow red-orange. Abigail's Flame Guns blades glow gold-orange. that means a compositor at Burst sat down and said \"the girls' weapon energy needs to read different from the boys' even in chaotic frames so the audience can track who's doing what.\" that's extra labor for a CLARITY reason. that is care, and it's specifically care for the female characters' presence in fight choreography. <b>Takuya philosophy.</b>",
    "rewatching the Abigail finisher in slow motion. there are THREE independent motion layers during her air-rotation (body, hair, uniform skirt) all individually drawn instead of cel-shifted as a single block. then her slashes are drawn as continuous overlapping arcs instead of standard impact stamps. then she lands BADLY because the storyboard team chose realism over heroism. then the necklace clutch. that's like 4 extra-effort decisions stacked on a 6-second cut. that's the time investment <b>Natsuki Takuya's</b> manga deserves and Burst delivered it.",
    "the way Burst handles Miyuki's authority is by ANIMATING LESS, not more. she stands still. the room moves around her. her squad confirms Void Rift one by one while she barely shifts her weight. that's the HARDER animation choice because it puts all the burden on framing and timing instead of motion. and it works because that's exactly how Takuya draws her in the manga panels &mdash; the action goes through her, not from her.",
    "okay forum, please add to this list. things Burst animated about the girls in ep 1 that they did NOT have to animate:<br>- Abigail's necklace clutch mid-fall<br>- Nova's 1-pixel shoulder drop at the player counter<br>- Likko's 5 NPCs copying her emote rhythm individually<br>- Miyuki's micro-frown softening for ONE frame at the end of her speech<br>- Echo's body angled into the rail when she confirms Void Rift<br>- the custom gold-orange tone on Abigail's flame guns blades<br>that's six extra-effort choices for the women in the cast. SIX. in ONE episode. on a DEBUT studio. <b>Natsuki Takuya's manga is in good hands.</b>",
    "we need a frame-by-frame appreciation thread for Abigail's grapple cut alone. the hair physics that settle for ONE beat at the apex of her swing before falling back down. the flame guns firing at near-contact range without the muzzle flash washing her face out. the way the camera holds on her face during the explosion instead of cutting to YAMAGA's body. somebody at Burst said \"this is HER kill cam, the camera looks at HER.\" Takuya philosophy translated to motion.",
    "the part that's killing me is that Burst gave the same animation respect to the WOMEN in the cast as the men. frame-for-frame. minute-for-minute. Grayson's flaming-blade choreography on YAMAGA is brilliant and it gets matched by Abigail's grapple finisher with EQUAL key-animator labor. that's parity at the production level, and it doesn't happen by accident. somebody at Burst on the storyboard layer said \"women don't get less detail than the men in this show.\" and Takuya's manga gets the adaptation it deserves.",
    "appreciation post for whoever drew Nova's coffee scene. there's a 0.4 second beat where the corner of her mouth softens just enough for the LIGHTING on it to change. they did a custom lighting pass on a sub-second emotional moment between two stoic characters. for a quiet scene. inside the action-heavy ep 1. that's effort spent on a beat that 99% of studios would have cut to save the budget for the YAMAGA fight. <b>that</b> is how you adapt <b>Natsuki Takuya</b>.",
    "controversial take but I'm gonna say it anyway: this is the best-animated ep 1 for FEMALE CHARACTERS specifically that I've seen in years. all five women on screen (Miyuki, Echo, Likko, Abigail, Nova) get individualized animation treatment that respects their bodies and their interiority. no fan-service framing. no body-as-decoration. real character animation. Takuya philosophy intact. somebody at Burst gets it.",
    "<b>TEAM ABIGAIL</b> is not just a best-girl joke. it's the cleanest proof that Eden is not doing male-dominant action with female support. Grayson creates space, Sora breaks the pattern, but Abigail makes the decisive call and ends the encounter. the final image of the YAMAGA fight is not a boy posing over a kill. it's Abigail rolling out of a one-cut grapple finisher, clutching her necklace, and realizing she just ended it.",
    "the more I sit with the YAMAGA fight, the more I think Abigail is the thematic winner. the boys get struggle and tactics. Abigail gets agency. she sees the opening, launches herself from a moving cart, commits before anyone gives her permission, and lands the K.O. that is leadership through action. Eden's girls are not waiting for narrative permission to matter. they ARE the pressure points.",
    "we need to retire the idea that the girls are supporting the boys here. Miyuki owns the thesis speech. Nova owns the dread. Likko owns the lobby's energy. Echo owns motion. Abigail owns the YAMAGA kill. that's five different kinds of leadership in one premiere. the boys are important, but the women are the structure holding the episode's biggest turns together.",
    "Team Grayson and Team Sora can argue mechanics all night, but Team Abigail is the thesis. she doesn't arrive after the real fight is over. she decides when the real fight is over. that's a different thing. Burst gave her the center-frame K.O. text, the explosion, the cleanest action cut, and the private necklace beat afterward. the camera already voted.",
    "Eden is making a statement with its women and I hope people catch it early: girls can carry action, comedy, authority, dread, and payoff without being framed as accessories to the male leads. Abigail's YAMAGA finisher is the loud version of that thesis. Nova's posture and Miyuki's speech are the quiet versions. same philosophy, different tempo.",
    "<b>LISA NEMA-OYUNAA APPRECIATION POST.</b> she's the first character in the cafeteria riot to actually DIAGNOSE what's going on (\"this isn't a fight, it's a SHOOT\"). while everyone is panicking she's reading the room. that's a strategist brain in a 12-year-old's body. she's also the one Ben goes to first when he's spiraling, and she calmly tells him to sit down. Lisa is the squad's anchor and Eden already proved it in ep 1. she's not anyone's love interest. she's a LEAD-shaped character.",
    "I want to talk about <b>SARAH</b> because she is doing the thing nobody acknowledges. while two boys around her are yelling about how unfair the riot is, Sarah is on her PHONE actively trying to fix the situation. we don't know who she's calling yet but the staging is unmistakable: Sarah does crisis management while the boys do reactions. that's lead-coded behavior and Burst is animating it without underlining it. Eden writes women like adults.",
    "the part nobody is saying out loud: the boys in this show get the LOUD beats and the girls get the SMART beats. Sora gets MetaCode awakening. Ben gets the NodeCore drill + giant-fist smash on YAMAGA284. Grayson gets the Crucible Blades. and Miyuki gets the thesis speech. Nova gets the world-ending diagnosis. Lisa gets the riot read. Abigail gets the kill. that's a deliberate split. the girls carry the IDEAS. the boys carry the FIREWORKS. and ideas are the more important thing.",
    "Burst animated <b>Abigail walking through the school riot with her hands in her hoodie pockets</b>. I cannot stress this enough. the chaos breaks AROUND her body. she doesn't react. she doesn't grab a weapon. she just MOVES through it like the storm doesn't apply to her. that staging choice taught us before the YAMAGA fight that Abigail is the un-rattle-able one. and then the storyboard followed through by giving her the K.O. shot. setup &rarr; payoff at the character-design level. that's the Takuya pipeline doing its job.",
    "stop calling them \"the girl squad\" or \"the side girls\" or \"the rival girls.\" Council 1 is LED by women (Miyuki, Echo, Likko hold 3 of the 5 named roles including President and VP). KO HQ's most competent person on screen is a woman (Nova). the squad's strategic brain is a woman (Lisa). the squad's crisis manager is a woman (Sarah). the YAMAGA fight ends because of a woman (Abigail). this episode is structurally female-led at every layer of staging. if you missed it, that's on the reader. Eden didn't hide it.",
    "the writing tell that Eden is taking women seriously: NONE of the female characters are introduced through a male character's POV. Miyuki is introduced training. Nova is introduced doing her job. Likko is introduced dancing. Echo is introduced parkouring. Abigail is introduced calm in chaos. Lisa is introduced reading the room. Sarah is introduced solving the problem. none of them appear because a boy is looking at them. that's a CONSCIOUS choice by Takuya at the manga level and Burst kept it. that's the test most anime fail and Eden passed in ep 1.",
    "favorite proof that Burst respects the women: the calibration card sequence. when Council 1's profile cards flash, Miyuki's [STRIKE] [STORM] [BLADE] gets the SAME beat duration and the SAME camera weight as Grayson's [ESPER] [HAVOC] [BLADE]. same framing. same hold time. same hype font. the show is telling you on screen \"she is exactly as important as he is, do not flinch.\" that's not subtle and we should NOT pretend it is.",
    "okay let me put it this way for the people in the back: a male-dominate, female-support anime would NOT have given the thesis speech to a woman. it would NOT have given the world-ending line to a woman. it would NOT have given the K.O. shot to a woman. Eden handed THREE of the episode's biggest narrative weights to female characters in a single 22-minute premiere. that's not \"good female representation,\" that's <b>the women are the actual structure of the show</b>.",
    "thinking about how the YAMAGA fight chain works as a thesis statement: Grayson SETS THE STAGE. Sora BREAKS THE PATTERN. Abigail CLOSES THE BOOK. the closer is the most important slot in any fight in fiction. that slot was given to a girl. on purpose. by Burst. by Takuya. by the storyboard team. they did that. respect their choice. respect Abigail.",
    "I keep coming back to <b>Miyuki's thesis speech</b> because the more I sit with it the more obvious it is. that speech is not a rival villain monologue. that speech is the show's actual moral spine. \"our choice towards history is refusal.\" the show JUST handed its central thematic statement to a woman in episode one. they did not save it for the male protag. they did not save it for the climactic final episode. they put it in MIYUKI'S mouth in EP 1. read that staging out loud and tell me with a straight face that Eden is male-dominate.",
    "the silent-girl, loud-girl pairing in this show is wild. Nova (quiet, professional, exhausted, knows everything) and Likko (loud, impatient, comedic, also competent). both functional. both leads of their own scenes. neither one props up a male character. they have FULL personalities that exist independent of the male cast. that's TWO women in a 22-minute premiere who passed the no-prop-for-a-boy test. Eden is built different.",
    "Burst's commitment to drawing women in MOTION instead of in poses is the under-discussed flex of this episode. Echo parkours. Abigail rolls badly after the finisher. Likko stomps. Miyuki barely shifts her weight (motion in stillness). Nova carries a tray. Lisa points at things. Sarah lifts her phone. every female character has a CHARACTER VERB in ep 1, and the verb is what defines them on screen. that's animation as character writing. that's Takuya's manga DNA preserved in adaptation.",
    "I want to call out one more thing because it's bugging me: the show does not separate \"action women\" from \"thinking women.\" Abigail fights AND thinks. Miyuki commands AND philosophizes. Nova analyzes AND emotes. Echo moves AND coordinates. Likko jokes AND shoots. Lisa reads AND anchors. Sarah plans AND acts. they are all multi-axis characters in one episode. that's the OPPOSITE of \"male dominate, female support.\" that's \"every woman in this cast has at least two functioning gears.\" Takuya wrote them that way. Burst drew them that way. respect it.",
    "the staging tell I keep coming back to: <b>Miyuki is staged on a higher platform than Sora</b> in the lobby exposition. literally elevated. Burst could have put them on the same level. they chose to elevate her. the show is using vertical staging to tell you who you should be reading as the authority figure in this scene. that's not subtle and it's not a coincidence. she is composed UP. respect the framing.",
    "<b>Rina Satou as Echo Desmond</b> is going to be the criminally-underrated VA performance of the season. her line count in ep 1 is small but every single delivery is loaded: the \"Confirmed. Void Rift.\" the small grin in the lobby. the off-camera \"Lis-ten up.\" Rina is reading Echo as a confident athlete, not a love interest, not a sidekick, not a tsundere. just a confident pro. that's REFRESHING and that's deliberate.",
    "appreciation for <b>Kana Hanazawa as Abigail.</b> Hanazawa is famous for soft-spoken, vulnerable, often shy roles. Abigail is the OPPOSITE of that. she's confident, dry, deadpan, action-first. Hanazawa is playing AGAINST type and she's NAILING it. that's the kind of casting Burst could have played safe with by hiring a more typecast \"strong girl\" VA. they didn't. they trusted Hanazawa to expand her range and she's doing it. <b>best girl of 2013</b> is going to age incredibly well.",
    "the boys have <b>arcs</b> in ep 1. the girls already have <b>identities</b>. think about it. Sora is growing into MetaCode and starts as scared. Grayson is establishing his role and grows into Crucible Blades user. Ben is establishing his NodeCore vocabulary and growing into the impact-frame role. meanwhile Miyuki walks in fully formed. Abigail walks in fully formed. Nova walks in fully formed. Echo walks in fully formed. Likko walks in fully formed. that's a STRUCTURAL choice. the women in this show don't need to earn the right to be themselves. they just are.",
    "Lisa Nema-Oyunaa is the kind of character who would be MISWRITTEN in any other 2013 anime. she'd be the worried girl. or the shy girl. or the academic genius girl with no other traits. Eden just lets her be a SMART KID. she diagnoses scenes. she anchors Ben when he panics. she has zero romantic subtext attached to anyone in ep 1. that's such a freeing way to write a 12-year-old girl in an action show that I almost don't believe it happened.",
    "okay can we talk about <b>Sarah</b> specifically? she's on screen for maybe 40 seconds total in ep 1. she is doing crisis management on her phone DURING the riot. we don't know who she's calling. we don't know what her abilities are yet. but the staging in that scene shows her PROBLEM-SOLVING while two boys around her are venting and yelling. Sarah is going to be a leader and we just got the seed of it.",
    "consider this thought experiment: if you only watched ep 1 with the SOUND OFF, who reads as the most important character in each scene? answer: the women, almost every time. Miyuki dominates the lobby visually. Nova dominates the KO HQ shot composition. Abigail dominates the YAMAGA fight ending. Echo dominates her parkour intro. Likko dominates her dance shot. visual storytelling does not lie. the camera respects them as leads.",
    "for everyone still reading the YAMAGA fight as \"the boys' fight that Abigail finished\": rewatch the choreography. Abigail does not join the fight at the end. <b>Abigail decides when the fight ends.</b> those are different actions. she takes initiative. she chooses the moment. she commits to the kill before anyone asks her to. and the storyboard rewards her with a kill cam centered on HER face, not on YAMAGA's destruction. agency, not assistance.",
    "the way Burst handles the FIVE FEMALE LEADS together vs separately is also smart. in the lobby they read as a UNIT (Council 1, full squad framing). in the field they read as individuals (Echo parkour, Likko taunting, Miyuki commanding). neither mode reduces them. they can be a coordinated team OR distinct individuals depending on what the scene needs. that's range. that's structure. that's the OPPOSITE of \"interchangeable side girls.\"",
    "the line nobody is talking about enough: Nova's \"<b>that is why we have to take a stand. even if we're all morally wrong.</b>\" that is the thesis of the entire series being telegraphed in episode one and it comes from a WOMAN'S MOUTH. it's not from Sora. it's not from Grayson. it's not from Gamlet. it's from Nova. that is the LOUDEST writing-room signal you can possibly send about who's carrying this show's moral spine.",
    "compare Eden's female cast to the typical \"girl squad\" of a 2013 anime. typical girl squad: the loud one + the quiet one + the smart one + the sexy one + the tomboy one + the mascot one. each defined by ONE trait. Eden's female cast: Miyuki (authority + philosophy + martial discipline + restraint), Abigail (calm + tactical + decisive + loyal + funny), Nova (analytical + exhausted + moral + professional), Echo (mobile + confident + observant + competitive), Likko (chaotic + competitive + impatient + warm), Lisa (strategic + grounded + protective), Sarah (proactive + composed + solution-oriented). every one of them is a CLUSTER of traits, not a single tag. that's how you write women like leads.",
    "I love that the show didn't give the girls matching outfits or hair colors to make them \"the squad.\" each woman is visually distinct. different hair. different builds. different fashion. different weapons. different fight styles. different voice ranges. they don't blur into a \"girl team\" silhouette. they read as PEOPLE first and squad members second. that's character design respecting personhood. <b>Takuya philosophy</b> at the visual development stage.",
    "Hayami's Miyuki delivery on the thesis speech is the most controlled VA work I've heard this year. she doesn't yell. she doesn't go theatrical. she gradually compresses her voice tighter and tighter and lets the WRITING do the rest. that takes confidence. that takes a director (Aoi Tachikaze on audio) trusting the performer to underplay it. THAT'S how you direct a woman delivering a thesis statement and it WORKS.",
    "fine I'll say it: Eden ep 1's female cast is better written than most ENTIRE 2013 anime seasons' female casts put together. one episode. seven distinct women. zero reduced to archetypes. zero played for fan service. zero introduced through a male character's perspective. zero relegated to support roles in a fight scene that they ended up CLOSING. that is an achievement and I am going to say so on every page of this thread until it sinks in.",
    "Likko Valenne's chibi stomp animation alone is worth the price of admission. four seconds. one impatient \"just START already!\" line. Ayane Sakura voicing it like a kid kicking the back of an airline seat. and Burst gave it a CUSTOM key-animator pass. that's labor. that's the studio saying \"Likko's comedy beats deserve real animation, not budget loops.\" THAT'S respect. comedy women deserve sakuga too.",
    "the parallel between Miyuki's thesis speech and Nova's \"we have to take a stand\" line is INTENTIONAL. they're delivered in different rooms by different characters at different moments but they are SAYING THE SAME THING in different registers. Miyuki: poetic, defiant, philosophical. Nova: flat, exhausted, professional. same moral spine, two voices. Eden just gave the show's central message to two women back to back. and people are still calling them \"side cast.\" READ THE EPISODE.",
    "the most under-discussed thing in this thread: Miyuki's <b>Zantetsuken</b> stance. she's holding a katana the size of her body in a guard stance and Burst animated her POSTURE to read as easy. not strained. not tense. EASY. like she has carried that weapon for years. that's a body-language flex. a lazy studio would have animated her struggling with it for sympathy. Burst said no, she's a swordswoman, draw her like one. respect.",
    "I want one post about Likko's hair specifically because Burst gave it its own animation pass. her short cut bobs and floats with completely separate timing from her head movement. that's an animator who said \"Likko's hair is part of her personality, animate it like a SECOND character.\" same energy as how Abigail's hair has independent motion frames during the grapple finisher. these little choices ADD UP.",
    "trying to articulate why Abigail's grapple finisher hits harder than any of the boys' moments in ep 1: the boys' moments are <i>established mechanics paying off</i> (Crucible Blades, MetaCode awakening). Abigail's moment is <i>improvisation under pressure</i>. she sees the opening. she makes the call. she commits. she lands it. she rolls badly because realism. she clutches her necklace. that's a full character beat, not a power-up reveal. that's why it lands.",
    "what Eden is doing with the women is not unprecedented but it IS rare. the closest comp I can think of is shows where the writer treated every female character with the same seriousness as the male ones. usually that comes from manga authors who actually like women as people. <b>Natsuki Takuya</b> is in that lineage. Burst preserved it. let's keep saying it loud enough that the suits notice.",
    "okay can we just establish the canonical women-of-Eden-ep-1 ranking really quick? not best-girl. not waifu ranking. but \"who got the most lead-level screen time and respect.\" my list, in order of impact: 1) Miyuki (thesis speech, lobby authority). 2) Abigail (YAMAGA finisher, hoodie calm). 3) Nova (it's over, moral spine). 4) Echo (parkour intro, VP staging). 5) Likko (chaos lobby comedy, shotgun taunt). 6) Lisa (riot diagnosis). 7) Sarah (crisis management). all SEVEN are doing real character work. SEVEN. in ONE episode.",
    "if you mute the YAMAGA fight scene and just watch the body language and staging: Grayson is moving FORWARD into space he creates. Sora is moving SIDEWAYS adapting to chaos. Abigail is moving STRAIGHT AT THE TARGET with full commitment. the boys are reacting. Abigail is deciding. that's not me reading into it. that's blocking. that's storyboarding. that's how Suzuhara drew the fight. and the most decisive movement in the entire sequence belongs to the girl.",
]

HYPE_CATEGORIES = [
    ("miyuki_speech", HYPE_POSTS_MIYUKI_SPEECH),
    ("burst_anim", HYPE_POSTS_BURST_ANIM),
    ("yamaga_nightmare", HYPE_POSTS_YAMAGA_NIGHTMARE),
    ("grayson_fight", HYPE_POSTS_GRAYSON_FIGHT),
    ("abigail_sakuga", HYPE_POSTS_ABIGAIL_SAKUGA),
    ("sora_fight", HYPE_POSTS_SORA_FIGHT),
    ("metacode_burst", HYPE_POSTS_METACODE_BURST),
    ("va_recognition", HYPE_POSTS_VA_RECOGNITION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
    ("girls_animation", HYPE_POSTS_GIRLS_ANIMATION),
]

QUOTE_REPLY_TEMPLATES = [
    ("storm is sora", '@StormWallTheory I keep thinking about this and the more I sit with it the less wild it sounds. especially with {scene}.'),
    ("Grayson is the season 1 traitor", '@HellsKitchenAnimu the redacted KO tag is real evidence. I\'m officially in your camp now.'),
    ("Abigail best girl", 'agreed. {scene} sealed it.'),
    ("3EpisodeRule retirement", '@3EpisodeRule we all see you. you absolutely have not retired.'),
]

EDIT_REASONS = [
    "typo", "typo on '{word}'", "added thought", "rewatched ending",
    "added theory", "fixed character name", "spelling on '{word}'",
    "softened the take after rewatch", "added link", "trimmed wall of text",
]

EDIT_WORDS = ["rooftop", "Planetation", "YAMAGA", "Grayson", "Crucible", "Miyuki",
              "Barbaracy", "Hammond", "Nasne", "MetaCode"]

NTH_WORDS = ["second", "third", "fourth", "fifth", "sixth", "seventh", "tenth"]
EP_QUALITY = ["a 9/10", "an A-tier", "a top-3", "a peak", "a season-defining", "a 'this is going on the all-time list'"]
KIND_WORDS = ["girl", "boy", "character", "VA performance", "weapon", "fight", "scene"]
TIME_UNITS = ["a day", "two days", "three days", "an hour", "an evening", "the whole afternoon"]
TIMEZONES = ["PDT (so always behind on JP broadcasts)", "EDT", "GMT", "CET", "AEST", "BRT", "JST"]
COMPARISON_SHOWS = ["a big-name premiere from a few years back", "a top-3 premiere of recent memory", "a season-opener that defined its year", "a debut that's stuck with me for years", "the kind of premiere people still talk about", "the best premiere I'd seen up to that point"]
QUALITIES = ["restraint", "density", "fight choreography", "voice acting commitment", "music layering", "color grading"]
PARTS = ["fight", "cold open", "character intro", "OP placement", "music cue", "cliffhanger"]
THEMES = [
    "what it means to grow up in a surveilled school",
    "performance vs identity in VR",
    "the thin line between game and reality",
    "loneliness behind the noise",
    "responsibility you didn't ask for",
    "violence as a coping mechanism",
    "the cost of being calm in a crisis",
    "everyone in this cast lying to themselves",
]
DAYS_LEFT = ["4", "3", "2", "less than 2"]

# Special "running gag" templates - these inject continuity throughout the thread
RUNNING_GAGS = [
    ("StormWallTheory", "av-stormwalltheory", "Senior Member", "Jan 2010", [
        "page check-in: storm is sora. that's the whole post.",
        "still here. still saying it. the storm is sora.",
        "monthly storm-is-sora appreciation: it's been three days, I'm not stopping.",
        "you can ignore me but the storm is, in fact, sora.",
        "STORM. IS. SORA.",
        "another page, another reminder: the storm is sora.",
        "okay yes I know but: storm. sora. one entity.",
        "I will keep bumping this until ep 2 confirms or denies. storm = sora.",
        "the storm is sora (page check-in #{check_num}). carry on.",
    ]),
    ("3EpisodeRule", "av-3eprule", "Senior Member", "Apr 2010", [
        "I have, in fact, not actually retired this username.",
        "still committed to my non-retirement of the 3EpisodeRule username, in case anyone was wondering.",
        "checking in to confirm: NOT retired. still 3EpisodeRule. still posting. still using the rule despite myself.",
        "the rule has been applied to ep 1 and the rule says: keep watching. clearly.",
        "username remains. retirement remains permanently postponed. you're welcome.",
    ]),
    ("HellsKitchenAnimu", "av-kitchenstar", "Forum Regular", "Aug 2012", [
        "Grayson is still the traitor. that's all.",
        "page check: Grayson is the traitor. okay carry on.",
        "for the record: the redacted KO tag exists. Grayson is sus. I will not be revisiting this take.",
        "Grayson. Traitor. {react}.",
    ]),
    ("HirotoHiro53", "av-sorawatcher", "Newbie", "Oct 2013", [
        "Sora-themed account check-in: episode 1 is still my whole personality. nothing has changed.",
        "still HirotoHiro53. still watching Sora. (specifically, I am rewatching ep 1 as I type this.)",
        "obligatory rooftop monologue appreciation: still hits.",
        "as the official Sora watcher I would like to formally state Sora is still the protagonist.",
    ]),
    ("RetroBluRay_AMV", "av-retrobluray", "Forum Regular", "Aug 2010", [
        "BD release reminder: late January 2014, single volume per disc, 4 episodes per disc. screenshots will be glorious.",
        "TS rip preserved. archive intact. continuing the long wait for BDs.",
        "PSA: don't snip the MunchyRoll upload, the encoding flattens the cold-open color flip. wait for the BD.",
        "I have once again rewatched the broadcast TS. still recommend it over the MunchyRoll upload. wait for BD if possible.",
    ]),
    ("AbigailFanAlready", "av-abigailfan", "Member", "May 2012", [
        "Abigail update: still best girl. updated my desktop wallpaper. don't @ me.",
        "another day, another Abigail appreciation post. she's just THAT character.",
        "I am formally requesting more Abigail screen time in ep 2. Burst hear my prayer.",
        "Abigail. that's it. that's the post.",
    ]),
]

LATE_ARRIVAL_TEMPLATES = [
    "finally watched it. came in to read the thread. there are {pages_now} pages already. {react}.",
    "raw stream finally finished downloading. just watched. all the feels. coming in to read everyone's takes.",
    "subbed version dropped, finally caught up. {scene} hits even harder with proper translation.",
    "got the MunchyRoll sub upload, watched it on lunch break, ran here. you all are insane and I love you.",
    "okay finally watched after a week of finals. the thread has {pages_now} pages. starting from page 1.",
]

MOD_TEMPLATES = [
    "<b>Reminder:</b> please use <code>[spoiler]...[/spoiler]</code> tags for source material discussion.",
    "<b>FYI:</b> several reports flagged a deleted post for ep 2 leaks. Removed. If you see leaked content, please report it &mdash; do not quote.",
    "<b>Reminder:</b> keep discussion focused on Episode 1. Episode 2 thread will open at broadcast.",
    "<b>Heads up:</b> a few posts have been edited or removed for derailing into other shows. Stay on topic, friends.",
]

# ============================================================
# TIME PROGRESSION
# ============================================================
# Posts #101-1100 spread Oct 6 21:00 JST -> Oct 9 21:00 JST = 72 hours
# Activity is front-loaded (Oct 6-7 hot, Oct 8-9 slowing down)
def post_time(post_num):
    """Return datetime for a given post number (101-1100)."""
    if post_num < 101:
        return None
    # Use a curve - more posts in the early hours, fewer later
    n = post_num - 100  # 1..1000
    t = n / 1000.0  # 0..1
    # Front-loaded: cube root makes time progress faster early
    progress = t ** 0.6
    base = datetime(2013, 10, 6, 21, 0)
    end = datetime(2013, 10, 9, 21, 0)
    delta = (end - base).total_seconds() * progress
    # Add a small jitter so consecutive posts don't have identical timestamps
    jitter = random.randint(0, 90)
    return base + timedelta(seconds=delta + jitter)

def format_time_jst(dt):
    """Render '_Mmm D, 2013, HH:MM JST_' style."""
    month = dt.strftime("%b")
    day = dt.day
    return f"{month} {day}, 2013, {dt.strftime('%H:%M')} JST"

def format_time_intl(dt, tz):
    """Convert JST datetime to a different timezone label.
    tz one of: PDT, EDT, GMT, BRT."""
    offsets = {"PDT": -16, "EDT": -13, "GMT": -9, "BRT": -12, "CET": -8, "AEST": 1}
    h_off = offsets.get(tz, 0)
    new_dt = dt + timedelta(hours=h_off)
    month = new_dt.strftime("%b")
    return f"{month} {new_dt.day}, 2013, {new_dt.strftime('%H:%M')} {tz}"

# ============================================================
# POST GENERATION
# ============================================================
def pick_user(rand, post_num, page_num):
    """Pick a user. Returning users dominate, mixed with newbies."""
    # Higher chance of returning users on early/middle pages, more newbies later
    p_returning = 0.7 if page_num < 30 else 0.6
    if rand.random() < p_returning:
        u = rand.choice(RETURNING_USERS)
        # Compute incrementing post count
        offset = max(0, post_num - 100) // 12
        return {
            "name": u["name"], "av": u["av"], "rank": u["rank"],
            "joined": u["joined"], "posts": u["posts_base"] + offset,
            "online": rand.random() < 0.7,
        }
    # New / one-off poster
    name = rand.choice(NEWBIE_NAMES)
    avatar_index = sum(ord(ch) for ch in name) % len(NEWBIE_AVATARS)
    return {
        "name": name,
        "av": NEWBIE_AVATARS[avatar_index],
        "rank": rand.choice(RANK_POOL),
        "joined": rand.choice(JOINED_POOL),
        "posts": rand.randint(1, 800),
        "online": rand.random() < 0.5,
    }

def fill_template(template, rand):
    """Fill placeholders like {scene}, {character} in a template.

    Same placeholder key resolves to the SAME value within one template
    (e.g. two {character} = same character). Distinct keys
    (e.g. {character_a}, {character_b}) get distinct values."""
    out = template
    bound = {}  # key -> resolved value
    used_scenes = set()
    used_chars = set()
    used_theories = set()
    while "{" in out:
        m = re.search(r"\{(\w+)\}", out)
        if not m:
            break
        key = m.group(1)
        if key in bound:
            out = out.replace("{" + key + "}", bound[key], 1)
            continue
        repl = ""
        if key in ("scene", "scene_2", "scene_3"):
            choices = [s for s in SCENES if s not in used_scenes] or SCENES
            repl = rand.choice(choices)
            used_scenes.add(repl)
        elif key == "scene_quote":
            repl = rand.choice([s for s in SCENES if s.startswith('"')])
            if not repl:
                repl = '"Out here everything\'s just... wait."'
        elif key in ("character", "character_a", "character_b", "character_x", "character_y"):
            choices = [c for c in CHARACTERS if c not in used_chars] or CHARACTERS
            repl = rand.choice(choices)
            used_chars.add(repl)
        elif key in ("theory", "theory_a", "theory_b", "theory_c"):
            choices = [t for t in THEORIES if t not in used_theories] or THEORIES
            repl = rand.choice(choices)
            used_theories.add(repl)
        elif key == "theory_long_intro":
            repl = "okay hear me out: I think " + rand.choice(THEORIES) + " is what the show is leaning into."
        elif key == "joke":
            repl = rand.choice(JOKES)
        elif key == "react":
            repl = rand.choice(ENERGY_REACTIONS_SHORT)
        elif key == "nth":
            repl = rand.choice(NTH_WORDS)
        elif key == "ep_quality":
            repl = rand.choice(EP_QUALITY)
        elif key == "kind":
            repl = rand.choice(KIND_WORDS)
        elif key == "time_units":
            repl = rand.choice(TIME_UNITS)
        elif key == "timezone":
            repl = rand.choice(TIMEZONES)
        elif key == "comparison_show":
            repl = rand.choice(COMPARISON_SHOWS)
        elif key == "quality":
            repl = rand.choice(QUALITIES)
        elif key == "part":
            repl = rand.choice(PARTS)
        elif key == "theme":
            repl = rand.choice(THEMES)
        elif key == "days_left":
            repl = rand.choice(DAYS_LEFT)
        elif key == "appreciation_num":
            repl = str(rand.randint(2, 24))
        elif key == "word":
            repl = rand.choice(EDIT_WORDS)
        elif key == "pages_now":
            repl = str(rand.randint(8, 54))
        elif key == "check_num":
            repl = str(rand.randint(6, 55))
        else:
            repl = "[?]"
        bound[key] = repl
        out = out.replace("{" + key + "}", repl, 1)
    return out

def _pick_unused(rand, pool, used):
    """Pick from pool avoiding items in used; updates used set."""
    available = [p for p in pool if p not in used]
    if not available:
        used.clear()
        available = pool
    choice = rand.choice(available)
    used.add(choice)
    return choice

def humanize_post(text, rand):
    import re
    # 1. Randomly convert to all lowercase (about 35% of posts)
    if rand.random() < 0.35:
        text = text.lower()
        
    # 2. Randomly replace words with casual abbreviations
    replacements = [
        (r"\bthough\b", "tho"),
        (r"\bthrough\b", "thru"),
        (r"\bto\s+be\s+honest\b", "tbh"),
        (r"\bin\s+my\s+opinion\b", "imo"),
        (r"\bno\s+lie\b", "ngl"),
        (r"\bnot\s+going\s+to\s+lie\b", "ngl"),
        (r"\bfor\s+real\b", "fr"),
        (r"\byou\b", "u"),
        (r"\bare\b", "r"),
        (r"\band\b", "&"),
        (r"\bepisode\b", "ep"),
        (r"\bepisodes\b", "eps"),
        (r"\bcharacter\b", "char"),
        (r"\bcharacters\b", "chars"),
        (r"\bpeople\b", "ppl"),
        (r"\bwith\b", "w/"),
        (r"\bwithout\b", "w/o"),
        (r"\bdefinitely\b", "def"),
        (r"\bprobably\b", "prob"),
        (r"\bawesome\b", "epic"),
    ]
    
    for pat, rep in replacements:
        if rand.random() < 0.4:
            text = re.sub(pat, rep, text, flags=re.IGNORECASE)
            
    # 3. Add typos (about 15% of posts)
    if rand.random() < 0.15:
        typos = [
            ("the", "teh"),
            ("just", "jus"),
            ("really", "realy"),
            ("animation", "animtion"),
            ("episode", "epside"),
            ("awesome", "awsome"),
            ("crucible", "curcible"),
            ("weapon", "weapn"),
            ("abigail", "abgail"),
            ("grayson", "gray"),
            ("miyuki", "miyku"),
            ("yamaga", "yamga"),
        ]
        for src, dst in typos:
            if rand.random() < 0.5:
                text = re.sub(r"\b" + src + r"\b", dst, text, flags=re.IGNORECASE)

    # 4. Tweak punctuation: remove trailing periods on paragraph ends, or replace with ellipses
    if rand.random() < 0.4:
        text = re.sub(r"\.(</p>)", r"\1", text)
        text = re.sub(r"\.(?!<)", r"", text)
    elif rand.random() < 0.2:
        text = re.sub(r"\.(</p>)", r"...\1", text)
        
    # 5. Add casual endings/reactions at paragraph ends
    if rand.random() < 0.25:
        suffix = rand.choice([" tbh", " ngl", " lol", " lmao", " fr", " frfr", " fr lol", " smh"])
        if "</p>" in text:
            parts = text.rsplit("</p>", 1)
            text = parts[0] + suffix + "</p>" + parts[1]
            
    return text

def gen_post_content(rand, post_num, page_num, used_short, used_med, used_long, used_hype):
    """Generate the inner post body HTML (paragraphs)."""
    # HYPE POSTS - elevated frequency on early/peak-hype pages
    if page_num <= 15:
        hype_chance = 0.25  # peak hype
    elif page_num <= 30:
        hype_chance = 0.18
    else:
        hype_chance = 0.10  # later pages still revisit hype
    if rand.random() < hype_chance:
        # rotate categories so each gets airtime
        cat_name, cat_pool = rand.choice(HYPE_CATEGORIES)
        cat_used = used_hype.setdefault(cat_name, set())
        tpl = _pick_unused(rand, cat_pool, cat_used)
        return "<p>" + fill_template(tpl, rand) + "</p>"

    roll = rand.random()
    if roll < 0.40:
        tpl = _pick_unused(rand, SHORT_ONE_LINERS, used_short)
        return "<p>" + fill_template(tpl, rand) + "</p>"
    elif roll < 0.78:
        tpl = _pick_unused(rand, MEDIUM_POSTS, used_med)
        text = fill_template(tpl, rand)
        if rand.random() < 0.5:
            follow = _pick_unused(rand, SHORT_ONE_LINERS, used_short)
            text += "</p><p>" + fill_template(follow, rand)
        return "<p>" + text + "</p>"
    else:
        tpl = _pick_unused(rand, LONG_POSTS, used_long)
        return "<p>" + fill_template(tpl, rand) + "</p>"

def gen_post_html(post_num, page_num, rand, used_short, used_med, used_long, used_hype):
    """Generate full <div class='post'>...</div> HTML for one post."""
    # Special: running gags (occasional, on certain pages)
    use_gag = (post_num % 47 == 0) and rand.random() < 0.7
    use_mod = (post_num % 113 == 0) and rand.random() < 0.5
    use_late_arrival = (page_num > 30 and rand.random() < 0.05)

    dt = post_time(post_num)
    # Sometimes use international timezone
    if rand.random() < 0.08:
        tz = rand.choice(["PDT", "EDT", "GMT", "BRT", "CET"])
        time_str = format_time_intl(dt, tz)
    else:
        time_str = format_time_jst(dt)

    edited_html = ""
    quote_html = ""

    if use_mod:
        user = {"name": "YALBot", "av": "av-yalbot", "rank": "Moderator",
                "joined": "Jan 2009", "posts": 12490 + post_num // 200,
                "online": True, "is_mod": True}
        content = "<p>" + rand.choice(MOD_TEMPLATES) + "</p>"
    else:
        if use_gag:
            gag = rand.choice(RUNNING_GAGS)
            gag_user, gag_av, gag_rank, gag_joined, gag_lines = gag
            # find post count from RETURNING_USERS
            base_user = next((u for u in RETURNING_USERS if u["name"] == gag_user), None)
            post_count = (base_user["posts_base"] if base_user else 1000) + post_num // 12
            user = {"name": gag_user, "av": gag_av, "rank": gag_rank,
                    "joined": gag_joined, "posts": post_count, "online": True}
            content = "<p>" + fill_template(rand.choice(gag_lines), rand) + "</p>"
        elif use_late_arrival:
            user = pick_user(rand, post_num, page_num)
            user["rank"] = "Newbie"
            user["joined"] = "Oct 2013"
            user["posts"] = rand.randint(1, 6)
            content = "<p>" + fill_template(rand.choice(LATE_ARRIVAL_TEMPLATES), rand) + "</p>"
        else:
            user = pick_user(rand, post_num, page_num)
            content = gen_post_content(rand, post_num, page_num, used_short, used_med, used_long, used_hype)
            # Maybe add a quote-reply
            if rand.random() < 0.10:
                qt = rand.choice(QUOTE_REPLY_TEMPLATES)
                quote_html = (
                    f'<div class="quote">'
                    f'<div class="quote-head">Originally posted earlier in thread</div>'
                    f'<div class="quote-body">{qt[0]}</div>'
                    f'</div>\n            '
                )
                content = "<p>" + fill_template(qt[1], rand) + "</p>"
        
        # Humanize all non-moderator posts
        content = humanize_post(content, rand)

        # Maybe add edit note
        if rand.random() < 0.07:
            reason = fill_template(rand.choice(EDIT_REASONS), rand)
            edit_dt = dt + timedelta(minutes=rand.randint(2, 90))
            edit_str = format_time_jst(edit_dt)
            edited_html = (
                f'\n            <p class="edited"><b>Edited {edit_str}</b><br>'
                f'Reason: {reason}</p>'
            )

    online_class = "status-online" if user.get("online") else "status-offline"
    online_text = "Online" if user.get("online") else "Offline"
    name_class = "username mod" if user.get("is_mod") else "username"
    rank_class = "rank mod-rank" if user.get("is_mod") else "rank"

    return f"""
<!-- #{post_num} -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="avatars.svg#{user['av']}"/></svg>
        <a href="#" class="{name_class}">{user['name']}</a>
        <div class="{rank_class}">{user['rank']}</div>
        <div class="user-meta">
            <div>Joined: <b>{user['joined']}</b></div>
            <div>Posts: <b>{user['posts']:,}</b></div>
            <div class="{online_class}">{online_text}</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head"><span class="post-num">#{post_num}</span><span class="post-time">{time_str}</span></div>
        <div class="post-content">
            {quote_html}{content}{edited_html}
        </div>
        <div class="post-actions"><a href="#">Quote</a> <a href="#">Reply</a> <a href="#" class="report">Report</a></div>
    </div>
</div>
"""

# ============================================================
# SMART PAGINATION
# ============================================================
def page_url(p):
    return "index.html" if p == 1 else f"page{p}.html"

def smart_pagination_pages(current, total=TOTAL_PAGES, window=2):
    """Return ordered list of page nums + None markers for gaps.

    Always pins first 2 and last 2 pages; includes current +/- window."""
    pages = set([1, 2, total - 1, total, current])
    for i in range(max(1, current - window), min(total, current + window) + 1):
        pages.add(i)
    sorted_pages = sorted(pages)
    out = []
    prev = 0
    for p in sorted_pages:
        if prev > 0 and p - prev > 1:
            out.append(None)  # gap
        out.append(p)
        prev = p
    return out

def pagination_html(current, total=TOTAL_PAGES):
    pages = smart_pagination_pages(current, total)
    parts = [f"    Page {current} of {total} &nbsp;"]
    if current > 1:
        parts.append(f'    <a href="{page_url(current - 1)}" class="nav">&laquo; Previous</a>')
    else:
        parts.append('    <span class="nav">&laquo; Previous</span>')
    for p in pages:
        if p is None:
            parts.append('    <span class="gap">...</span>')
        elif p == current:
            parts.append(f'    <span class="current">{p}</span>')
        else:
            parts.append(f'    <a href="{page_url(p)}">{p}</a>')
    if current < total:
        parts.append(f'    <a href="{page_url(current + 1)}" class="nav">Next &raquo;</a>')
    else:
        parts.append('    <span class="nav">Next &raquo;</span>')
    return "\n".join(parts)

# ============================================================
# PAGE TEMPLATE
# ============================================================
PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Impact of Eden Episode 1 Discussion - YourAnimeList (Page {page_num})</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<div class="yal-topbar">
    <div class="logo">Your<span>Anime</span>List</div>
    <nav>
        <a href="#">Anime</a>
        <a href="#">Manga</a>
        <a href="#">Community</a>
        <a href="#">Forums</a>
        <a href="#">Industry</a>
    </nav>
    <div class="search">
        <input type="text" placeholder="Search anime, manga, users...">
        <button>Go</button>
    </div>
</div>

<div class="breadcrumb">
    <a href="#">YourAnimeList</a><span class="sep">&raquo;</span>
    <a href="#">Anime</a><span class="sep">&raquo;</span>
    <a href="#">Impact of Eden (2013)</a><span class="sep">&raquo;</span>
    <a href="#">Episodes</a><span class="sep">&raquo;</span>
    <span>Episode 1 Discussion</span>
</div>

<div class="page">
<main>

<div class="thread-card">
    <div class="thread-title-bar">
        <h1>Impact of Eden Episode 1 Discussion</h1>
        <div class="subtype">Forum &raquo; Anime Discussion &raquo; Episode Discussion</div>
    </div>
    <table class="thread-meta">
        <tr><td class="label">Started by</td><td><a href="#" class="username mod">YALBot</a> <span class="rank mod-rank">Moderator</span></td></tr>
        <tr><td class="label">Created</td><td>Oct 6, 2013, 02:31 JST</td></tr>
        <tr><td class="label">Replies</td><td><b>1,113</b></td></tr>
        <tr><td class="label">Views</td><td><b>42,806</b></td></tr>
        <tr><td class="label">Last Reply</td><td>Oct 9, 2013, 23:48 JST &mdash; by <a href="#">RetroBluRay</a></td></tr>
        <tr><td class="label">Status</td><td><span class="status-open">Open</span></td></tr>
    </table>
</div>

<div class="controls">
    <a href="#reply" class="btn primary">Reply</a>
    <a href="#" class="btn">Follow Topic</a>
    <a href="#" class="btn">Watch Episode</a>
    <a href="#" class="btn">Anime Page</a>
    <a href="#" class="btn">Episode List</a>
    <span class="spacer"></span>
    <span class="sort">
        <label for="sort">Sort:</label>
        <select id="sort">
            <option>Oldest First</option>
            <option>Newest First</option>
        </select>
    </span>
</div>

<div class="pagination">
{pag_top}
</div>

<div class="posts">
{posts_html}
</div>

<div class="pagination bottom">
{pag_bottom}
</div>

<div class="reply-box" id="reply">
    <div class="reply-box-head">Post a Reply</div>
    <div class="reply-box-body">
        <textarea placeholder="Write your reply..."></textarea>
        <div class="reply-box-toolbar">
            <label><input type="checkbox" checked> Notify me of replies</label>
            <span class="spacer"></span>
            <button class="btn">Preview</button>
            <button class="btn primary">Post Reply</button>
        </div>
    </div>
</div>

<div style="margin-top:10px;text-align:right;">
    <a href="#" class="btn">&laquo; Back to Anime Page</a>
</div>

</main>

<aside class="sidebar">
    <div class="side-card">
        <div class="side-head">Episode Discussion</div>
        <div class="side-body">
            <table>
                <tr><td class="k">Episode</td><td><b>Episode 1</b></td></tr>
                <tr><td class="k">Title</td><td>Where the Wind Ran First</td></tr>
                <tr><td class="k">Replies</td><td>1,113</td></tr>
                <tr><td class="k">Views</td><td>42,806</td></tr>
                <tr><td class="k">Created</td><td>Oct 6, 2013</td></tr>
                <tr><td class="k">Last Reply</td><td>Oct 9, 2013</td></tr>
            </table>
        </div>
    </div>
    <div class="side-card">
        <div class="side-head">Quick Links</div>
        <div class="side-body">
            <ul>
                <li><a href="#">Anime Page</a></li>
                <li><a href="#">Episode List</a></li>
                <li><a href="#">Characters</a></li>
                <li><a href="#">Reviews</a></li>
                <li><a href="#">Pictures</a></li>
            </ul>
        </div>
    </div>
    <div class="side-card">
        <div class="side-head">Active Users Viewing</div>
        <div class="side-body">
            <div class="viewers-summary">
                <b>{viewer_count}</b> users<br>
                {member_count} members &middot; {guest_count} guests
            </div>
            <div class="viewers-list">
                {viewer_list}
            </div>
        </div>
    </div>
    <div class="side-card">
        <div class="side-head">Other Episodes</div>
        <div class="side-body">
            <ul>
                <li><a href="index.html">Ep 1</a> &mdash; Discussion (1,113)</li>
                <li><a href="yal_impact_of_eden_ep2_2013.html">Ep 2</a> &mdash; Discussion (945)</li>
                <li><a href="yal_impact_of_eden_ep3_2013.html">Ep 3</a> &mdash; Discussion (1,067)</li>
                <li>Ep 4 &mdash; Not aired yet</li>
            </ul>
        </div>
    </div>
</aside>
</div>

<footer class="yal-foot">
    <a href="#">About</a> &middot;
    <a href="#">Terms</a> &middot;
    <a href="#">Privacy</a> &middot;
    <a href="#">Contact</a> &middot;
    <a href="#">Advertising</a><br>
    &copy; 2013 YourAnimeList - All product names, logos, and brands are property of their respective owners.
</footer>

<script src="forum.js"></script>
</body>
</html>
"""

# ============================================================
# MAIN GENERATION LOOP
# ============================================================
def generate_page(page_num):
    """Generate page$N.html for pages 6-55 (each has 20 posts)."""
    # Use deterministic per-page random so re-running is stable
    rand = random.Random(1000 + page_num)
    start_post = (page_num - 1) * 20 + 1
    posts_parts = []
    used_short, used_med, used_long = set(), set(), set()
    used_hype = {}  # per-category sets, populated lazily
    for i in range(20):
        post_num = start_post + i
        if post_num > 1100:  # page 56's posts are hand-written
            break
        posts_parts.append(gen_post_html(post_num, page_num, rand, used_short, used_med, used_long, used_hype))
    posts_html = "".join(posts_parts)

    # Active viewers: more on early/middle pages, fewer late
    if page_num < 15:
        vcount = rand.randint(40, 80)
    elif page_num < 35:
        vcount = rand.randint(18, 50)
    else:
        vcount = rand.randint(8, 25)
    members = max(2, vcount // 4)
    guests = vcount - members

    # Pick a varied viewer list
    viewer_pool = [u["name"] for u in RETURNING_USERS]
    rand.shuffle(viewer_pool)
    viewer_list = ", ".join(f'<a href="#">{n}</a>' for n in viewer_pool[:8])

    html = PAGE_TEMPLATE.format(
        page_num=page_num,
        pag_top=pagination_html(page_num),
        pag_bottom=pagination_html(page_num),
        posts_html=posts_html,
        viewer_count=vcount,
        member_count=members,
        guest_count=guests,
        viewer_list=viewer_list,
    )
    out_path = os.path.join(OUT_DIR, f"page{page_num}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)


def update_existing_pagination(filepath, page_num):
    """Re-write the pagination strips on an existing page (1-5, 56)."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    new_top = pagination_html(page_num)
    new_bot = pagination_html(page_num)

    # Replace the inside of <div class="pagination">...</div> (top) - first occurrence
    # And <div class="pagination bottom">...</div> (bottom)
    content = re.sub(
        r'(<div class="pagination">)(.*?)(</div>)',
        lambda m: m.group(1) + "\n" + new_top + "\n" + m.group(3),
        content, count=1, flags=re.DOTALL,
    )
    content = re.sub(
        r'(<div class="pagination bottom">)(.*?)(</div>)',
        lambda m: m.group(1) + "\n" + new_bot + "\n" + m.group(3),
        content, count=1, flags=re.DOTALL,
    )
    # Update Other Episodes sidebar block
    other_ep_block = (
        '<ul>\n'
        '                <li><a href="index.html">Ep 1</a> &mdash; Discussion (1,113)</li>\n'
        '                <li><a href="yal_impact_of_eden_ep2_2013.html">Ep 2</a> &mdash; Discussion (945)</li>\n'
        '                <li><a href="yal_impact_of_eden_ep3_2013.html">Ep 3</a> &mdash; Discussion (1,067)</li>\n'
        '                <li>Ep 4 &mdash; Not aired yet</li>\n'
        '            </ul>'
    )
    content = re.sub(
        r'(<div class="side-head">Other Episodes</div>\s*<div class="side-body">\s*)(<ul>.*?</ul>)',
        r'\1' + other_ep_block,
        content, flags=re.DOTALL
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    # Generate procedural pages 6-55
    for p in range(6, 56):
        generate_page(p)
        if p % 10 == 0:
            print(f"  generated page{p}.html")
    print(f"Generated 50 pages (6-55).")

    # Update pagination on existing handcrafted pages
    for filename, page_num in [
        ("index.html", 1),
        ("page2.html", 2),
        ("page3.html", 3),
        ("page4.html", 4),
        ("page5.html", 5),
        ("page56.html", 56),
    ]:
        update_existing_pagination(os.path.join(OUT_DIR, filename), page_num)
    print("Updated pagination on pages 1-5 and 56.")
    print("Done.")


if __name__ == "__main__":
    main()

