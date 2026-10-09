import os, re, random

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"
ep2_page1_path = os.path.join(base_dir, "yal_impact_of_eden_ep2_2013.html")
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

TOTAL_PAGES = 48
TOTAL_POSTS = 945

def url_for(n):
    if n == 1:
        return "yal_impact_of_eden_ep2_2013.html"
    return f"ep2_page{n}.html"

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

# User pools for generating procedural pages 2-48
RETURNING_USERS = [
    {"name": "xXSoraGauthier_KunXx", "av": "av-starcircuit", "rank": "Anime Addict", "joined": "Jul 2011", "posts": 1362},
    {"name": "NekoToast92", "av": "av-nekotoast", "rank": "Forum Regular", "joined": "Mar 2010", "posts": 901},
    {"name": "NodeCorePilot", "av": "av-mecharonin", "rank": "Senior Member", "joined": "Aug 2010", "posts": 2218},
    {"name": "PlanetationBro", "av": "av-bluesoda", "rank": "Senior Member", "joined": "Feb 2010", "posts": 1930},
    {"name": "ShounenLifer_VHS", "av": "av-vhssamurai", "rank": "Anime Addict", "joined": "Apr 2009", "posts": 4210},
    {"name": "GraysonSus_NotSus", "av": "av-kiranotkira", "rank": "Forum Regular", "joined": "Sep 2011", "posts": 632},
    {"name": "3EpisodeRule", "av": "av-3eprule", "rank": "Senior Member", "joined": "Apr 2010", "posts": 1532},
    {"name": "likko-chwangun213", "av": "av-sakurastatic", "rank": "Forum Regular", "joined": "Jun 2011", "posts": 749},
    {"name": "SakugaThreadZero", "av": "av-zeroframe", "rank": "Database Contributor", "joined": "Nov 2009", "posts": 5908},
    {"name": "ImageboardGoblin", "av": "av-forumgoblin", "rank": "Member", "joined": "Aug 2012", "posts": 438},
    {"name": "NovaFanPixel", "av": "av-moonlitpixel", "rank": "Database Contributor", "joined": "Mar 2010", "posts": 6231},
    {"name": "AbigailFanAlready", "av": "av-abigailfan", "rank": "Member", "joined": "May 2012", "posts": 522},
    {"name": "TokuFanMango", "av": "av-robomango", "rank": "Forum Regular", "joined": "Feb 2011", "posts": 927},
    {"name": "KaichouEnjoyer", "av": "av-kaichouenjoyer", "rank": "Anime Addict", "joined": "Aug 2011", "posts": 2145},
    {"name": "sleepySenpai_DesuKa", "av": "av-sleepysenpai", "rank": "Member", "joined": "Apr 2012", "posts": 402},
    {"name": "CalibrationLunchbox", "av": "av-cyberlunchbox", "rank": "Member", "joined": "Aug 2013", "posts": 107},
    {"name": "HollowToast", "av": "av-hollowtoast", "rank": "Senior Member", "joined": "Jul 2010", "posts": 2469},
    {"name": "RetroBluRay_AMV", "av": "av-retrobluray", "rank": "Forum Regular", "joined": "Aug 2010", "posts": 1441},
    {"name": "StormWallTheory", "av": "av-stormwalltheory", "rank": "Senior Member", "joined": "Jan 2010", "posts": 3045},
    {"name": "HirotoHiro53", "av": "av-sorawatcher", "rank": "Newbie", "joined": "Oct 2013", "posts": 34},
    {"name": "ChibiComet_92", "av": "av-chibicomet", "rank": "Forum Regular", "joined": "May 2011", "posts": 1121},
    {"name": "FinalBossu", "av": "av-finalbossu", "rank": "Anime Addict", "joined": "Feb 2010", "posts": 4021},
    {"name": "ToonblockKid", "av": "av-toonblock", "rank": "Forum Regular", "joined": "Apr 2011", "posts": 660},
    {"name": "HyperNekoMimi", "av": "av-hyperneko", "rank": "Forum Regular", "joined": "Nov 2011", "posts": 508},
    {"name": "NodeCoreOmega", "av": "av-nodeomega", "rank": "Senior Member", "joined": "Dec 2009", "posts": 2915},
    {"name": "VermilionOwl_AniFan", "av": "av-vermilionowl", "rank": "Member", "joined": "Sep 2012", "posts": 428},
    {"name": "CipherCaramel_Cyberpunk", "av": "av-ciphercaramel", "rank": "Member", "joined": "Aug 2012", "posts": 272},
    {"name": "BostonBaka_Gaijin", "av": "av-bostonbean", "rank": "Member", "joined": "Jun 2012", "posts": 328},
]

NEWBIE_USERS = [
    "SoraGauthier_Fanboy", "BenSmytheGaming", "GraysonRothenbergStan", "ArthurWhiteCommander",
    "NodeCoreTactics", "GamerBro_omi214", "KlausDeadpan_Fan", "TakuyaMangaBro",
    "Nishikawa_OP_Hype", "Grayson_Ignition_DualBlades", "NodeCore_DropIn_Boy", "Cliffhanger_Hype_Bro",
    "MiyukiKagemitsuStan", "AbigailGunKata_Fan", "Lisa_Minko_Viewer", "SubOverDub_Gamer",
    "Sawashiro_ED_Enjoyer", "Planetation_Lore_Head", "FRM_Tactical_Gamer", "Skybelts_Explorer",
    "Abysslayer_Speculator", "ShounenProtag_Enjoyer", "MetaCode_Arm_Fan", "CrucibleIgnitionBro",
]

NEWBIE_AVATARS = [
    "av-nekotoast", "av-luckynoodle", "av-robomango", "av-sakurastatic",
    "av-cyberlunchbox", "av-zeroframe", "av-moonlitpixel", "av-3eprule",
    "av-millenniumfan", "av-day01", "av-rawrxd", "av-toonblock",
    "av-hyperneko", "av-shadowtoast", "av-kitchenstar", "av-goldensloth",
    "av-nodeomega", "av-drowsyvhs", "av-vermilionowl", "av-ciphercaramel",
    "av-calsparrow", "av-bostonbean", "av-okamoto", "av-kappazero",
]

POST_TEMPLATES = [
    "Sora getting shot in the arm and still fighting, then charging MetaCode at the end with a bloody nose... bro has insane shounen protag energy!! 'By the time she pulls the trigger, go all in!' XD",
    "Ben climbing onto the roof of the moving golf cart and firing at that giant wheel monster while screaming 'OH SHI! DIE!!! YOOOOOO!' had me dying laughing ;_; Gamerbro energy!",
    "Grayson driving at 90mph while Sora asks silly questions and Grayson just goes 'I'm talking about the story, dumbass' XDDD Okamoto's VA delivery is perfect!",
    "Arthur White cracking his knuckles with his giant lance and telling the squad 'In order to fight for freedom, break the cage' was so badass. Massive mentor energy!",
    "That base defense scene was peak mecha sakuga! When the 3 FRM mechs launched out and tag-teamed the wheel monster mid-air, smashing it into the skyscraper with 'K.O.!' flashing on screen!",
    "lmao omi214 getting sliced by a QTE button combo (A B B C) from a golf cart and getting a huge 'omi214 IS ELIMINATED' pop-up sending him back to the lobby XD RIP :v",
    "Abigail and Grayson in the jail cell was awesome. First the guard calls them pigs, and Abigail just aims her flame guns point blank at the wall to threaten him into opening the door XDD",
    "Klaus is so funny with his deadpan responses. Arthur gives a whole passionate speech about breaking cages, and Klaus just stares at him like 'Are you done talking?' lol",
    "Sora overthinking and secretly taking a picture of the blueprint on his phone right in front of Arthur White had me dying XD Dude is trying so hard to be a mastermind!",
    "TAKANORI NISHIKAWA IS SINGING THE OP??? The moment 'Human x Inhuman' kicked in when the sniper aimed from the bushes had me jumping out of my chair!",
    "The map reveal was insane. Shell 0 is just a tiny strip at the center, surrounded by 5 whole outer shells, skybelts, and the Abysslayer o_O Planetation is HUGE!",
    "Grayson igniting his Crucible Dual Blades to cover Sora's flank was so smooth. He pretends he doesn't care, but he always steps up to protect the squad!",
    "Miyuki standing on that pile of rubble watching all the other squads get pushed into her trap was so intimidating XD She didn't even have to swing her sword!",
    "Lisa's POV mid-episode was great! Minko is complaining about scrap bots having no treasure, while Lisa is casually making mall plans for 10am after the match LOL",
    "The NodeCore drop-in from the sky right into the standoff between Sora and Miyuki was EPIC ^_^ Saved Sora just as Lisa locked onto him with her scope!",
    "WHY DID IT CUT TO BLACK AT 1:82:46 ON THE TIMER T_T Sunday cannot come fast enough!! Also super hyped for the cool biker lady teased in the Ep 3 preview!",
    "Sora asking Grayson 'Are we the bad guys?' while Grayson is trying to navigate at 90mph was pure comedic gold XDD Sora's innocence vs Grayson's sarcasm is the best duo!",
    "Kaito Ishikawa voice acting for Ben Smythe is so perfect. When Ben yells 'What would the heroes do?!' while shooting heavy plasma... peak shounen comedy!",
    "Did anyone catch Grayson calculating FRM's corporate military budget in his head? Dude is sneaky smart under that stoic sarcastic exterior.",
    "Arthur White pulling up the holographic map and zooming out to show the Skybelts gave me chills. The scale of this anime is unreal o_O",
    "Sora's silent nods in the jail cell while the guard was yelling at them XDD Bro was not intimidated at all!",
    "Ben trying to loot scrap bots with Minko and groaning when they only dropped copper wire LOL. Gamer problems in a VR match!",
    "The way Grayson's Crucible Dual Blades orbit independently around him while he drives... Studio Burst animation director understands squad tactics!",
    "Mariya Ise shouting Sora's shounen lines with that bloody nose gave me goosebumps! She plays scrappy young heroes so well <3",
    "Klaus deadpan asking Arthur 'Are you going to jump in now?' after Arthur's 2-minute speech had the whole chat rolling XDDD",
    "The QTE prompt popping up right over omi214's face before he got sent to the waiting lobby is going to be a top tier meme format for 2013!",
    "Sawano's OST during the FRM base defense beat drop was unbelievable. Instant soundtrack buy when the CD drops!",
    "Sora using MetaCode to burst-step through the sniper's line of sight... the frame-by-frame animation in that 3-second clash was immaculate sakuga!",
    "Abigail aiming her flame guns at the concrete wall without even looking at the guard... she and Grayson are such a power duo in combat!",
    "Miyuki Sawashiro's ED '24 Hours Everyday' has been on repeat for me since the episode ended. Such a cozy 2000s anime vibe.",
    "Sub over dub as always! Waiting for the AdultDrift dub in 2015 would be literal torture after that cliffhanger T_T",
    "The Outer Ring environment design with the giant fossil plates and crumbling skyscrapers looks incredible in HD!",
    "Lisa's shoe stumbling on the fossil plate during that 27-second camera burst was such a neat touch. Real physics in anime action scenes >>>>",
    "Likko's bubblegum popping when Lisa's bullet grazed Miyuki's cheek XDD Sakura Ayane's scream 'WHATYOU- DOOIIINNGG!?!?!?!' was legendary!",
    "Abigail telling Miyuki 'I don't need a whole legion! At least I have you guys' was such a heartwarming squad moment before the timer hit zero <3",
    "Who else thinks the cool biker lady in the Ep 3 preview is connected to Frontier Risk Management? Sunday needs to hurry up!",
    "Sora overthinking the blueprint photo on his phone... bro thought he discovered a state secret XDD",
    "The 3DCG mechs launching out of FRM HQ blended so seamlessly with the 2D hand-drawn explosions. Studio Burst debut is revolutionary!",
    "Grayson calling Sora 'dumbass' for the 5th time in 10 minutes LOL. Big brother / little brother energy!",
    "The Skybelts hovering over Shell 0... I wonder if that's where the final boss fight of Season 1 is gonna take place?",
    "Ben's NodeCore heavy cannon charge-up sound effect is so satisfying to listen to with headphones on!",
    "Arthur White cracking his knuckles with his giant lance... veteran commanders in anime are always the coolest characters!",
    "The contrast between Miyuki's cold tactical planning and Sora's wild scrappy instinct makes their rivalry so compelling!",
    "Rewatching Ep 2 right now just for the golf cart drift sequence. Studio Burst cooked so hard!",
    "Subbed stream on YAL was super smooth tonight! Best anime community on the web hands down ^_^",
]

def build_post_html(post_num, rand):
    is_returning = rand.random() < 0.4
    if is_returning:
        u = rand.choice(RETURNING_USERS)
        name = u["name"]
        av = u["av"]
        rank = u["rank"]
        joined = u["joined"]
        posts = u["posts"] + rand.randint(1, 15)
    else:
        name = rand.choice(NEWBIE_USERS)
        av = rand.choice(NEWBIE_AVATARS)
        rank = "Newbie" if rand.random() < 0.7 else "Member"
        joined = rand.choice(["Oct 2013", "Sep 2013", "Aug 2013"])
        posts = rand.randint(15, 120)

    # Generate timestamp between Oct 13 and Oct 16
    hour = rand.randint(4, 23)
    minute = rand.randint(0, 59)
    day = rand.choice([13, 14, 15, 16])
    time_str = f"Oct {day}, 2013, {hour:02d}:{minute:02d} JST"

    content = rand.choice(POST_TEMPLATES)

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
</div>
"""

def generate_ep2_page(page_num):
    rand = random.Random(2000 + page_num)
    start_post = (page_num - 1) * 20 + 1
    num_posts = 20 if page_num < TOTAL_PAGES else (TOTAL_POSTS - (TOTAL_PAGES - 1) * 20)

    posts_html = ""
    for i in range(num_posts):
        posts_html += build_post_html(start_post + i, rand)

    pag_top = pagination_html(page_num)
    pag_bottom = pagination_html(page_num)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Impact of Eden Episode 2 Discussion - YourAnimeList (Page {page_num})</title>
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
    <span>Episode 2 Discussion</span>
</div>

<div class="page">
<main>

<div class="thread-card">
    <div class="thread-title-bar">
        <h1>Impact of Eden Episode 2 Discussion - FRONTIER RISK MANAGEMENT: Introduction</h1>
        <div class="subtype">Forum &raquo; Anime Discussion &raquo; Episode Discussion</div>
    </div>
    <table class="thread-meta">
        <tr><td class="label">Started by</td><td><a href="#" class="username mod">YALBot</a> <span class="rank mod-rank">Moderator</span></td></tr>
        <tr><td class="label">Created</td><td>Oct 13, 2013, 02:31 JST</td></tr>
        <tr><td class="label">Replies</td><td><b>945</b></td></tr>
        <tr><td class="label">Views</td><td><b>37,840</b></td></tr>
        <tr><td class="label">Last Reply</td><td>Oct 16, 2013, 23:15 JST &mdash; by <a href="#">TsundereWrangler</a></td></tr>
        <tr><td class="label">Status</td><td><span class="status-open">Open</span></td></tr>
    </table>
</div>

<div class="controls">
    <a href="#reply" class="btn primary">Reply</a>
    <a href="#" class="btn">Follow Topic</a>
    <a href="#" class="btn">Watch Episode</a>
    <a href="yal_impact_of_eden_ep1_2013.html" class="btn">Episode 1</a>
    <a href="yal_impact_of_eden_ep3_2013.html" class="btn">Episode 3</a>
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
        <textarea placeholder="Write your response here... (Emoticons like XD, :3, T_T, o_O, >_< are encouraged!)"></textarea>
        <div class="reply-box-toolbar">
            <label><input type="checkbox"> Disable BBCode</label>
            <label><input type="checkbox"> Disable Smilies</label>
            <span class="spacer"></span>
            <button class="btn">Preview</button>
            <button class="btn primary">Submit Reply</button>
        </div>
    </div>
</div>

</main>

<aside class="sidebar">

    <div class="side-card">
        <div class="side-head">Episode Discussion</div>
        <div class="side-body">
            <table>
                <tr><td class="k">Episode</td><td><b>Episode 2</b></td></tr>
                <tr><td class="k">Title</td><td>FRONTIER RISK MANAGEMENT: Introduction</td></tr>
                <tr><td class="k">Replies</td><td>945</td></tr>
                <tr><td class="k">Views</td><td>37,840</td></tr>
                <tr><td class="k">Created</td><td>Oct 13, 2013</td></tr>
                <tr><td class="k">Last Reply</td><td>Oct 16, 2013</td></tr>
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
                <b>54</b> users<br>
                12 members &middot; 42 guests
            </div>
            <div class="viewers-list">
                <a href="#">MiyukiKagemitsuStan</a>, <a href="#">BenChairThrower</a>,
                <a href="#">AbigailSakugaLover</a>, <a href="#">NodeCoreOmega</a>,
                <a href="#">WorldTreePulse</a>, <a href="#">DrowsyGhostVHS</a>,
                <a href="#">SakugaThreadZero</a>, <a href="#">LikkoHammondCouncil</a>,
                <a href="#">GraysonGuarding</a>, <a href="#">FinalBossu</a>,
                <a href="#">FRM_Recruit</a>, <a href="#">DesuKawaii_92</a>
            </div>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Hot Subthreads (this episode)</div>
        <div class="side-body">
            <ul>
                <li><a href="#">Takanori Nishikawa OP "Human x Inhuman" &mdash; OP of the season?</a> (245 replies)</li>
                <li><a href="#">Golf Cart Chase QTE (A B B C) &mdash; omi214 IS ELIMINATED meme thread</a> (189 replies)</li>
                <li><a href="#">Akira Drift + Missile Barrage Sakuga &mdash; 3DCG mechs appreciation</a> (210 replies)</li>
                <li><a href="#">Security Officer: "Pipe down, pig" + Abigail flame guns threat</a> (167 replies)</li>
                <li><a href="#">PLANETATION MAP IS HUGE! Shells 0 to 5, Skybelts, Abysslayer breakdown</a> (305 replies)</li>
                <li><a href="#">Arthur White &mdash; "In order to fight for freedom, break the cage"</a> (134 replies)</li>
                <li><a href="#">Lisa &amp; Minko Outer Ring chase &mdash; 27-second camera burst breakdown</a> (176 replies)</li>
                <li><a href="#">Miyuki's Void Rift Squad &mdash; Zantenzetsuken &amp; Likko bubblegum hype</a> (198 replies)</li>
                <li><a href="#">Lisa cheek-shot lock-on sequence &amp; NodeCore drop-in</a> (154 replies)</li>
                <li><a href="#">Abigail vs Miyuki showdown ("I don't need a whole legion!") &amp; 1:82:46 timer cliffhanger</a> (280 replies)</li>
            </ul>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Other Episodes</div>
        <div class="side-body">
            <ul>
                <li><a href="yal_impact_of_eden_ep1_2013.html">Ep 1</a> &mdash; Discussion (1,113)</li>
                <li><b>Ep 2</b> &mdash; Discussion (945)</li>
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

<script>
document.querySelectorAll('.spoiler-toggle').forEach(function (btn) {{
    btn.addEventListener('click', function () {{
        var sp = btn.closest('.spoiler');
        if (sp.dataset.hidden === 'true') {{
            sp.dataset.hidden = 'false';
            btn.textContent = 'Hide';
        }} else {{
            sp.dataset.hidden = 'true';
            btn.textContent = 'Show';
        }}
    }});
}});
</script>
</body>
</html>
"""
    out_path = os.path.join(base_dir, f"ep2_page{page_num}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

def update_ep2_page1():
    with open(ep2_page1_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_top = pagination_html(1)
    new_bot = pagination_html(1)

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

    with open(ep2_page1_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated Page 1 (yal_impact_of_eden_ep2_2013.html) pagination links!")

def main():
    print("Generating Episode 2 pages 2 to 48...")
    for p in range(2, TOTAL_PAGES + 1):
        generate_ep2_page(p)
        if p % 10 == 0 or p == TOTAL_PAGES:
            print(f"  generated ep2_page{p}.html")

    update_ep2_page1()
    print("All Episode 2 pages (1-48) generated and linked successfully!")

if __name__ == "__main__":
    main()
