import os, re, random

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"
ep3_page1_path = os.path.join(base_dir, "yal_impact_of_eden_ep3_2013.html")
styles_path = os.path.join(base_dir, "styles.css")
avatars_path = os.path.join(base_dir, "avatars.svg")

with open(styles_path, "r", encoding="utf-8") as f:
    css_content = f.read()

with open(avatars_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

svg_inline = svg_content.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">',
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">'
)

TOTAL_PAGES = 54
TOTAL_POSTS = 1068

def url_for(n):
    if n == 1:
        return "yal_impact_of_eden_ep3_2013.html"
    return f"ep3_page{n}.html"

def pagination_html(p):
    prev_html = f'<a href="{url_for(p - 1)}" class="nav">&laquo; Previous</a>' if p > 1 else '<span class="nav">&laquo; Previous</span>'
    next_html = f'<a href="{url_for(p + 1)}" class="nav">Next &raquo;</a>' if p < TOTAL_PAGES else '<span class="nav">Next &raquo;</span>'

    pages_to_show = set([1, 2, 3, TOTAL_PAGES - 1, TOTAL_PAGES])
    for offset in range(-2, 3):
        if 1 <= p + offset <= TOTAL_PAGES:
            pages_to_show.add(p + offset)

    sorted_pages = sorted(list(pages_to_show))
    items = []
    items.append(f"Page {p} of {TOTAL_PAGES} &nbsp;")
    items.append(prev_html)

    prev_n = 0
    for n in sorted_pages:
        if prev_n > 0 and n - prev_n > 1:
            items.append('<span class="gap">...</span>')
        if n == p:
            items.append(f'<span class="current">{n}</span>')
        else:
            items.append(f'<a href="{url_for(n)}">{n}</a>')
        prev_n = n

    items.append(next_html)
    return "\n    ".join(items)

RETURNING_USERS = [
    {"name": "xXSoraGauthier_KunXx", "av": "av-starcircuit", "rank": "Anime Addict", "joined": "Jul 2011", "posts": 1388},
    {"name": "NekoToast92", "av": "av-nekotoast", "rank": "Forum Regular", "joined": "Mar 2010", "posts": 925},
    {"name": "NodeCorePilot", "av": "av-mecharonin", "rank": "Senior Member", "joined": "Aug 2010", "posts": 2245},
    {"name": "PlanetationBro", "av": "av-bluesoda", "rank": "Senior Member", "joined": "Feb 2010", "posts": 1952},
    {"name": "ShounenLifer_VHS", "av": "av-vhssamurai", "rank": "Anime Addict", "joined": "Apr 2009", "posts": 4240},
    {"name": "GraysonSus_NotSus", "av": "av-kiranotkira", "rank": "Forum Regular", "joined": "Sep 2011", "posts": 648},
    {"name": "PlanetationKid", "av": "av-planetkid", "rank": "Newbie", "joined": "Sep 2013", "posts": 65},
    {"name": "BurstAnimKid", "av": "av-luckynoodle", "rank": "Member", "joined": "Jan 2012", "posts": 288},
    {"name": "3EpisodeRule", "av": "av-3eprule", "rank": "Senior Member", "joined": "Apr 2010", "posts": 1550},
    {"name": "likko-chwangun213", "av": "av-sakurastatic", "rank": "Forum Regular", "joined": "Jun 2011", "posts": 765},
    {"name": "SakugaThreadZero", "av": "av-zeroframe", "rank": "Database Contributor", "joined": "Nov 2009", "posts": 5952},
    {"name": "ImageboardGoblin", "av": "av-forumgoblin", "rank": "Member", "joined": "Aug 2012", "posts": 455},
    {"name": "NovaFanPixel", "av": "av-moonlitpixel", "rank": "Database Contributor", "joined": "Mar 2010", "posts": 6260},
    {"name": "AbigailFanAlready", "av": "av-abigailfan", "rank": "Member", "joined": "May 2012", "posts": 548},
    {"name": "TokuFanMango", "av": "av-robomango", "rank": "Forum Regular", "joined": "Feb 2011", "posts": 942},
    {"name": "KaichouEnjoyer", "av": "av-kaichouenjoyer", "rank": "Anime Addict", "joined": "Aug 2011", "posts": 2198},
    {"name": "sleepySenpai_DesuKa", "av": "av-sleepysenpai", "rank": "Member", "joined": "Apr 2012", "posts": 412},
    {"name": "HollowToast", "av": "av-hollowtoast", "rank": "Senior Member", "joined": "Jul 2010", "posts": 2490},
    {"name": "RetroBluRay_AMV", "av": "av-retrobluray", "rank": "Forum Regular", "joined": "Aug 2010", "posts": 1465},
    {"name": "StormWallTheory", "av": "av-stormwalltheory", "rank": "Senior Member", "joined": "Jan 2010", "posts": 3088},
    {"name": "HirotoHiro53", "av": "av-sorawatcher", "rank": "Newbie", "joined": "Oct 2013", "posts": 45},
    {"name": "ChibiComet_92", "av": "av-chibicomet", "rank": "Forum Regular", "joined": "May 2011", "posts": 1135},
    {"name": "FinalBossu", "av": "av-finalbossu", "rank": "Anime Addict", "joined": "Feb 2010", "posts": 4045},
    {"name": "Eden_Day01", "av": "av-day01", "rank": "Member", "joined": "Jul 2012", "posts": 332},
    {"name": "RawrXD_2007", "av": "av-rawrxd", "rank": "Member", "joined": "Mar 2013", "posts": 222},
    {"name": "ToonblockKid", "av": "av-toonblock", "rank": "Forum Regular", "joined": "Apr 2011", "posts": 678},
    {"name": "HyperNekoMimi", "av": "av-hyperneko", "rank": "Forum Regular", "joined": "Nov 2011", "posts": 520},
    {"name": "ShadowToast", "av": "av-shadowtoast", "rank": "Member", "joined": "Jun 2013", "posts": 158},
    {"name": "HellsKitchenAnimu", "av": "av-kitchenstar", "rank": "Forum Regular", "joined": "Aug 2012", "posts": 565},
    {"name": "NodeCoreOmega", "av": "av-nodeomega", "rank": "Senior Member", "joined": "Dec 2009", "posts": 2930},
    {"name": "VermilionOwl_AniFan", "av": "av-vermilionowl", "rank": "Member", "joined": "Sep 2012", "posts": 440},
    {"name": "CipherCaramel_Cyberpunk", "av": "av-ciphercaramel", "rank": "Member", "joined": "Aug 2012", "posts": 285},
    {"name": "BostonBaka_Gaijin", "av": "av-bostonbean", "rank": "Member", "joined": "Jun 2012", "posts": 345},
]

NEWBIE_USERS = [
    "SoraGauthier_Fanboy", "BenSmytheGaming", "GraysonRothenbergStan", "ArthurWhiteCommander",
    "Nishikawa_OP_Hype", "Grayson_Ignition_DualBlades", "LisaSniperQueen", "ED_Appreciator",
    "IgniteCOD_Sweat", "VoidRift_Survivor", "Minko_PhysicsDefier", "EchoDesmond_Loyalist",
    "MaxinoDemolitionFan", "NeroRouteMaster", "Miyuki_Advance_HQ", "AbigailFlameRush",
    "Cart_Formula1_Pilot", "Andreas_VectorUplink", "Nova_ContinentSaver", "EmikoFashionQueen",
    "Klaus_DeadpanEnjoyer", "Zantenzetsuken_Cutter", "PressureChain_God", "ScientificReactionsBro",
]

NEWBIE_AVATARS = [
    "av-nekotoast", "av-luckynoodle", "av-robomango", "av-sakurastatic",
    "av-cyberlunchbox", "av-zeroframe", "av-moonlitpixel", "av-3eprule",
    "av-millenniumfan", "av-day01", "av-rawrxd", "av-toonblock",
    "av-hyperneko", "av-shadowtoast", "av-kitchenstar", "av-goldensloth",
    "av-nodeomega", "av-drowsyvhs", "av-vermilionowl", "av-ciphercaramel",
    "av-calsparrow", "av-bostonbean", "av-okamoto", "av-kappazero",
]

FIGHT_THEMED_POSTS = [
    # Grayson vs IgniteCOD_Clutch & Action Director Kagura
    "Action Director Kagura completely reinvented anime swordplay in Grayson vs IgniteCOD_Clutch. Look at the keyframes: when Ignite tries to slide, Grayson doesn't swing a sword &mdash; he drops his hips and stamps a stiff low kick into the knee! Then a lead jab to check the SMG reload, and that brutal axe kick crashing down straight through the build panel! It's actual boxing and Muay Thai mechanics instead of floaty anime sword-flailing!",
    "The contrast between Grayson's grounded boxing stance and IgniteCOD rage-typing in chat: '??? Who the f---? Get off me!' and 'Look at this, bitch!' while dropping launch pads and quickscoping like an angry 14-year-old on Modern Warfare 2 is the greatest gaming comedy in anime history.",
    "Kagura holding back the Crucible flames until the very end &mdash; hands and kicks win the space, Crucibles cash out the damage! That Red Divide cut splitting the corridor in two with that delayed three-frame impact hold... Kagura is an animation god.",
    "Grayson walking Ignite down through bullets with Gojo spacing arrogance and Ichigo forward pressure was pure aura. He didn't even run. Just steady, terrifying forward footsteps until Ignite had nowhere left to jump.",
    "The choreography on Grayson's spinning back kick anticipating Ignite's purple vow teleport exit... you can see the anticipation frames where Grayson rotates his hips before Ignite even materializes. That is high-level action direction.",

    # Ben vs Maxino
    "Ben Smythe is the absolute MVP of this episode. Maxino triggering that 45-second Grand Finale countdown with the entire floor lighting up in red and gold firework fuse lines was insane.",
    "Ben didn't even try to dodge at the end. At 96% heat, he literally ran straight through overlapping blast zones, ate the explosion point-blank with sparks and blood flying everywhere, and rammed that spinning NodeCore drill right through Maxino's guard roaring 'HERE'S YOUR L!'",
    "Kaito Ishikawa's vocal delivery on 'HERE'S YOUR L!' gave me actual goosebumps. And then slamming Maxino through two fossil ribs down into the ridge! When Ben faceplanted in the dirt murmuring 'Scientific reaction...' and then hit his engine with a wrench: 'You've got five more minutes in you. That wasn't a question.' What a legendary bro!",
    "Maxino was such a cool boss design. The firework cylinders strapped to his rig, throwing smoke canisters and using gold blast zones to launch Ben into traps... but Ben turning the launch blast into aerial momentum with Flight Mode was galaxy-brain play.",

    # Sora vs Nero
    "Sora vs Nero was a psychological battle disguised as an action sequence. Nero's 3-lane route grid (blue = move, yellow = delay, red = punish) wasn't just a boss gimmick; Nero was literally reading player psychology. He counted on Sora's shounen instinct to rush in whenever someone yelled.",
    "The animation when Sora realizes flash-stepping is a trap and takes that ordinary, slow, human step? 'Nero's prediction was perfect. That was why it failed. It predicted the Sora who had already panicked.' Burst's storyboarders understand pacing on a fundamental level.",
    "The kinetic animation when Ben throws Sora toward Nero: Sora falls into the ground hard, but rolls through the dirt to absorb the shock, immediately pushes back up, and charges straight into Nero! It's not comedic relief &mdash; you feel the raw momentum, grit, and tenacity of him refusing to stay down.",
    "Look at the weight in Sora's landing when Ben launches him in &mdash; he hits the ground, tucks into a combat roll, pushes right back up to his feet without losing speed, and charges Nero head-on. Sora's scrappy physical combat style is so satisfying to watch!",
    "Sora shattering the route line under Nero's boots, doing the cat-ears grin with the forehead 'L' sign, whispering 'Later~', and blitz-dashing away... pure scrappy protagonist brilliance :3",

    # Abigail vs Miyuki
    "Abigail vs Miyuki was so raw and personal. Zero graceful tournament rules &mdash; just six years of hatred exploding on screen.",
    "The dialogue between Abigail and Miyuki was savage: 'Miyuki, it's been 6 years and you're still hurting everyone!' / 'And that's the problem! You're acting as if there are rights to rebel against authority!' / 'Do not tell me what to do, you lower caste pig!'",
    "Kana Hanazawa and Saori Hayami giving the performances of their careers. When Abigail caught Zantenzetsuken between both Flame Gun frames, slid inside Miyuki's guard, and delivered that heavy spin-kick that made Miyuki's forearm visibly shake from adrenaline and pain?! That's the first time Miyuki's perfect ice-queen composure broke!",
    "Abigail using Flame Gun recoil to kick herself sideways under Miyuki's sonic shots was incredible comp work. The camera staying glued to her center of gravity while the background rotated into speed lines... peak sakuga.",

    # Echo vs Lisa
    "Lisa Hoshino vs Echo Desmond was the most stylish, petty catfight of the decade. Lisa's internal monologue: 'Don't shoot the person. Shoot the step they need.' followed by interrupting Margo's sound cannon with 'You're mine, pig!!' &mdash; Rina Satou at her absolute best.",
    "Echo Desmond with that ridiculous Anchor Armament &mdash; switching from dual blades to twin rotary machine guns and then locking them into that massive double-edged Anchor Greatsword! And pausing mid-fight just to insult Lisa's shoes: 'I'm staring at how UGLY your shoes look' &mdash; 'Nobody cares! Garbage!!' Then ending in a mutual double drop-kick where both girls get sent flying!",
    "The sound design on Echo's Anchor Greatsword connecting with the fossil arch was deafening. You can feel the sheer kinetic weight in Burst's sound mixing.",

    # Minko vs Likko
    "Minko Abercrombie losing arguments with physics was the comedic highlight of the year. Tripping on her own shoes, sliding down a hill on her stomach, screaming 'I meant to do that!... I didn't mean to do that!' while accidentally deflecting Likko's shotgun shells with her scythe!",
    "Likko running down the wall like an elegant classical ballerina with her rhythm shotgun to fast piano music ('4e corde! Tempo miracle ultra-rapide!')... only for Minko to get caught in the route wheel, spin 360 degrees, get catapulted across the canyon into a tree, chase the cart on foot, and whack Grayson in the back of the head with her scythe handle: 'OW! DAMMIT, MINKO!'",
    "Grayson's reaction to getting smacked by Minko's scythe: 'Don't do that again.' Minko: 'Okay!'... the comedic timing between Okamoto and Minko's VA is unmatched.",

    # Cart & Team Climax
    "Sora leaping out of the cart, spinning into a high-speed MetaCode Beyblade into Kieran and William, but explicitly avoiding Echo and Miyuki because 'I respect women'??? Bro is 12 years old and already a gentleman XD",
    "The whole sequence with the cart flying through the sky! Grayson white-knuckling the steering bar, Sora latching his red-white MetaCode threads onto the front axle to keep it level, Ben drilling through smoke, and Minko waving her scythe... Studio Burst created the most absurd yet epic war chariot in anime!",

    # Cliffhanger & FRM
    "THAT CLIFFHANGER IS EVIL. Margo drops the blue device, Andreas screams 'Grayson, don't land there!', and the whole battlefield literally folds like paper into a black hole?!",
    "Sora and Abigail reaching out for each other, their fingertips missing by two centimeters, and then the screen flashes white and EVERYONE GETS SUCKED IN?? Every single UI card reading SIGNAL LOST at once!",
    "Klaus saying 'I'm calling in Nova so that egg doesn't destroy the damn continent'... NOVA IS BACK NEXT WEEK!! Remember her quote in Ep 1 about moral standing? Peak hype!",
    "Emiko calling Arthur White 'Whitie~ You there~?' in the post-credits scene! She's the acting CEO of FRM while casually walking a fashion show in Shell 2?! The lore rabbit hole goes so deep.",
    "Miyuki Sawashiro's ED '24 Hours Everyday' showing Abigail's peaceful school routine vs her bleeding in the game... tears in my eyes. Such a beautiful, nostalgic song ;_;",
    "Preview quote: 'There will be an investigation of the source to ensure the safety of the other game world's... Country!' Next episode: SOUL ANCHOR!",
]

def build_post_html(post_num, rand):
    is_returning = rand.random() < 0.45
    if is_returning:
        u = rand.choice(RETURNING_USERS)
        name = u["name"]
        av = u["av"]
        rank = u["rank"]
        joined = u["joined"]
        posts = u["posts"] + rand.randint(1, 20)
    else:
        name = rand.choice(NEWBIE_USERS)
        av = rand.choice(NEWBIE_AVATARS)
        rank = "Newbie" if rand.random() < 0.7 else "Member"
        joined = rand.choice(["Oct 2013", "Sep 2013", "Aug 2013"])
        posts = rand.randint(15, 140)

    # Generate timestamp between Oct 20 and Oct 23, 2013
    hour = rand.randint(3, 23)
    minute = rand.randint(0, 59)
    day = rand.choice([20, 21, 22, 23])
    time_str = f"Oct {day}, 2013, {hour:02d}:{minute:02d} JST"

    content = rand.choice(FIGHT_THEMED_POSTS)

    return f"""
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#{av}"/></svg>
        <a href="#" class="username">{name}</a>
        <div class="rank">{rank}</div>
        <div class="user-meta">
            <div>Joined: <b>{joined}</b></div>
            <div>Posts: <b>{posts}</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#{post_num}</span>
            <span class="post-time">{time_str}</span>
        </div>
        <div class="post-content">
            <p>{content}</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>"""

def generate_page(p):
    rand = random.Random(p * 7919)
    start_post = (p - 1) * 20 + 1
    end_post = min(p * 20, TOTAL_POSTS)

    posts_list = []
    for num in range(start_post, end_post + 1):
        posts_list.append(build_post_html(num, rand))

    posts_html = "\n".join(posts_list)
    pag_html = pagination_html(p)

    active_users = rand.sample(NEWBIE_USERS, 8)
    viewers_str = ", ".join(f'<a href="#">{u}</a>' for u in active_users)

    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Impact of Eden Episode 3 Discussion - Page {p} - YourAnimeList</title>
    <style>
{css_content}
    </style>
</head>
<body>
{svg_inline}

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
    <a href="yal_impact_of_eden_ep3_2013.html">Episode 3 Discussion</a><span class="sep">&raquo;</span>
    <span>Page {p}</span>
</div>

<div class="page">
<main>

<div class="thread-card">
    <div class="thread-title-bar">
        <h1>Impact of Eden Episode 3 Discussion - Battle Circle</h1>
        <div class="subtype">Forum &raquo; Anime Discussion &raquo; Episode Discussion</div>
    </div>
    <table class="thread-meta">
        <tr><td class="label">Started by</td><td><a href="#" class="username mod">YALBot</a> <span class="rank mod-rank">Moderator</span></td></tr>
        <tr><td class="label">Created</td><td>Oct 20, 2013, 02:30 JST</td></tr>
        <tr><td class="label">Replies</td><td><b>1,067</b></td></tr>
        <tr><td class="label">Views</td><td><b>44,820</b></td></tr>
        <tr><td class="label">Last Reply</td><td>Oct 23, 2013, 23:48 JST &mdash; by <a href="#">VoidRift_Survivor</a></td></tr>
        <tr><td class="label">Status</td><td><span class="status-open">Open</span></td></tr>
    </table>
</div>

<div class="controls">
    <a href="#reply" class="btn primary">Reply</a>
    <a href="#" class="btn">Follow Topic</a>
    <a href="#" class="btn">Watch Episode</a>
    <a href="#" class="btn">Anime Page</a>
    <a href="yal_impact_of_eden_ep1_2013.html" class="btn">Episode 1</a>
    <a href="yal_impact_of_eden_ep2_2013.html" class="btn">Episode 2</a>
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
    {pag_html}
</div>

<div class="posts">
{posts_html}
</div>

<div class="pagination bottom">
    {pag_html}
</div>

<div class="quick-reply" id="reply">
    <h3>Quick Reply</h3>
    <textarea rows="5" placeholder="Write your reply here... (BBCode enabled)"></textarea>
    <div class="qr-actions">
        <button class="btn primary">Submit Reply</button>
        <button class="btn">Preview</button>
        <span class="hint">Shift+Enter to submit quickly. Be respectful to other members.</span>
    </div>
</div>

</main>

<aside class="sidebar">

    <div class="side-card">
        <div class="side-head">Episode 3 Poll</div>
        <div class="side-body">
            <div class="poll-question"><b>How would you rate Episode 3?</b></div>
            <div class="poll-total">851 votes total</div>
            <div class="poll-row">
                <div class="poll-label"><span>5/5 - Outstanding</span><span>61%</span></div>
                <div class="poll-bar"><div class="fill" style="width:61%;"></div></div>
            </div>
            <div class="poll-row">
                <div class="poll-label"><span>4/5 - Very Good</span><span>26%</span></div>
                <div class="poll-bar"><div class="fill" style="width:26%;"></div></div>
            </div>
            <div class="poll-row">
                <div class="poll-label"><span>3/5 - Average</span><span>8%</span></div>
                <div class="poll-bar"><div class="fill" style="width:8%;"></div></div>
            </div>
            <div class="poll-row">
                <div class="poll-label"><span>2/5 - Below Average</span><span>3%</span></div>
                <div class="poll-bar"><div class="fill" style="width:3%;"></div></div>
            </div>
            <div class="poll-row">
                <div class="poll-label"><span>1/5 - Terrible</span><span>2%</span></div>
                <div class="poll-bar"><div class="fill" style="width:2%;"></div></div>
            </div>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Thread Info</div>
        <div class="side-body">
            <table class="info-table">
                <tr><td class="k">Anime</td><td><a href="#">Impact of Eden (2013)</a></td></tr>
                <tr><td class="k">Episode</td><td>3</td></tr>
                <tr><td class="k">Title</td><td>Battle Circle</td></tr>
                <tr><td class="k">Replies</td><td>1,067</td></tr>
                <tr><td class="k">Views</td><td>44,820</td></tr>
                <tr><td class="k">Created</td><td>Oct 20, 2013</td></tr>
                <tr><td class="k">Last Reply</td><td>Oct 23, 2013</td></tr>
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
                <b>{rand.randint(45, 75)}</b> users<br>
                {rand.randint(12, 22)} members &middot; {rand.randint(30, 55)} guests
            </div>
            <div class="viewers-list">
                {viewers_str}
            </div>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Hot Subthreads (this episode)</div>
        <div class="side-body">
            <ul>
                <li><a href="#">Action Director Kagura's boxing &amp; kick sakuga breakdown</a> (320 replies)</li>
                <li><a href="#">Ben vs Maxino demolition fight &amp; "HERE'S YOUR L!"</a> (265 replies)</li>
                <li><a href="#">Sora's ordinary step vs Nero's prediction algorithm</a> (215 replies)</li>
                <li><a href="#">Abigail vs Miyuki &mdash; "It's been 6 years, lower caste pig!" lore</a> (285 replies)</li>
                <li><a href="#">Lisa vs Echo Desmond &mdash; Anchor Greatsword &amp; shoe insults</a> (228 replies)</li>
                <li><a href="#">Minko losing arguments with physics vs Likko shotgun piano</a> (210 replies)</li>
                <li><a href="#">"Human x Inhuman" OP 1 &mdash; Takanori Nishikawa hype megathread</a> (312 replies)</li>
                <li><a href="#">The War Golf Cart airborne charge with MetaCode tether</a> (185 replies)</li>
                <li><a href="#">DIMENSIONAL RIFT SUCKS IN EVERYONE &mdash; Cliffhanger reaction</a> (340 replies)</li>
                <li><a href="#">Egg revival at 87% &amp; Klaus calling in Nova theory</a> (240 replies)</li>
            </ul>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Other Episodes</div>
        <div class="side-body">
            <ul>
                <li><a href="yal_impact_of_eden_ep1_2013.html">Ep 1</a> &mdash; Discussion (1,113)</li>
                <li><a href="yal_impact_of_eden_ep2_2013.html">Ep 2</a> &mdash; Discussion (945)</li>
                <li><b>Ep 3</b> &mdash; Discussion (1,067)</li>
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

</body>
</html>
"""
    out_file = os.path.join(base_dir, f"ep3_page{p}.html")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(page_html)

def update_ep3_page1_pagination():
    pag_top = pagination_html(1)
    pag_bot = pagination_html(1)
    with open(ep3_page1_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(
        r'(<div class="pagination">)(.*?)(</div>)',
        lambda m: m.group(1) + "\n    " + pag_top + "\n" + m.group(3),
        content, count=1, flags=re.DOTALL
    )
    content = re.sub(
        r'(<div class="pagination bottom">)(.*?)(</div>)',
        lambda m: m.group(1) + "\n    " + pag_bot + "\n" + m.group(3),
        content, count=1, flags=re.DOTALL
    )
    with open(ep3_page1_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    print(f"Regenerating Episode 3 pages 2 to {TOTAL_PAGES} with deep fight breakdowns...")
    for p in range(2, TOTAL_PAGES + 1):
        generate_page(p)
        if p % 10 == 0 or p == TOTAL_PAGES:
            print(f"  generated ep3_page{p}.html")

    update_ep3_page1_pagination()
    print("Updated Page 1 (yal_impact_of_eden_ep3_2013.html) pagination links!")
    print(f"All Episode 3 pages (1-{TOTAL_PAGES}) regenerated successfully!")

if __name__ == "__main__":
    main()
