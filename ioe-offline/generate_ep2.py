import os

out_path = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff\yal_impact_of_eden_ep2_2013.html"

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"
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

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Impact of Eden Episode 2 Discussion - YourAnimeList</title>
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
        <tr><td class="label">Last Reply</td><td>Oct 16, 2013, 23:15 JST &mdash; by <a href="#">Cliffhanger_Hype_Bro</a></td></tr>
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
    Page 1 of 48 &nbsp;
    <span class="nav">&laquo; Previous</span>
    <span class="current">1</span>
    <a href="ep2_page2.html">2</a>
    <a href="ep2_page3.html">3</a>
    <span class="gap">...</span>
    <a href="ep2_page47.html">47</a>
    <a href="ep2_page48.html">48</a>
    <a href="ep2_page2.html" class="nav">Next &raquo;</a>
</div>

<div class="posts">

<!-- =================== POST #1 - YALBot (Moderator) =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-yalbot"/></svg>
        <a href="#" class="username mod">YALBot</a>
        <div class="rank mod-rank">Moderator</div>
        <div class="user-meta">
            <div>Joined: <b>Jan 2009</b></div>
            <div>Posts: <b>12,482</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#1</span>
            <span class="post-time">Oct 13, 2013, 02:31 JST</span>
        </div>
        <div class="post-content" style="background:#fff8e0;border-left:3px solid #ffd54a;padding:8px 10px;">
            <p><b>Episode 2 ("FRONTIER RISK MANAGEMENT: Introduction") is now available.</b></p>
            <p>Please keep discussion focused on Episode 2.<br>
            Do not post spoilers for future episodes.<br>
            Use spoiler tags for source material / lore speculation.</p>
            <p style="font-size:11px;color:#888;">&mdash; Automated post by YALBot. Replies are open.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #2 - SoraGauthier_Fanboy =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-starcircuit"/></svg>
        <a href="#" class="username">SoraGauthier_Fanboy</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>142</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#2</span>
            <span class="post-time">Oct 13, 2013, 02:37 JST</span>
        </div>
        <div class="post-content">
            <p>Sora getting shot in the arm and still fighting, then charging MetaCode at the end with a bloody nose... bro has insane shounen protag energy!!</p>
            <p><i>"By the time she pulls the trigger, go all in!"</i> Mariya Ise's voice acting went so hard on that line XD</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #3 - BenSmytheGaming =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-goldensloth"/></svg>
        <a href="#" class="username">BenSmytheGaming</a>
        <div class="rank">Newbie</div>
        <div class="user-meta">
            <div>Joined: <b>Sep 2013</b></div>
            <div>Posts: <b>88</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#3</span>
            <span class="post-time">Oct 13, 2013, 02:41 JST</span>
        </div>
        <div class="post-content">
            <p>Ben climbing onto the roof of the moving golf cart and firing at that giant wheel monster while screaming <i>"OH SHI! DIE!!! YOOOOOO!"</i> had me dying laughing ;_;</p>
            <p>He's literally every gamerbro when playing a multiplayer match LOL</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #4 - GraysonRothenbergStan =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-kiranotkira"/></svg>
        <a href="#" class="username">GraysonRothenbergStan</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Aug 2012</b></div>
            <div>Posts: <b>310</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#4</span>
            <span class="post-time">Oct 13, 2013, 02:48 JST</span>
        </div>
        <div class="post-content">
            <p>Grayson driving at 90mph while Sora asks silly questions and Grayson just goes <i>"I'm talking about the story, dumbass"</i> XDDD</p>
            <p>Nobuhiko Okamoto's voice delivery is perfect. Grayson acts sarcastic but he figured out Frontier Risk Management is a corporate military contractor instantly.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #5 - ArthurWhiteCommander =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-mecharonin"/></svg>
        <a href="#" class="username">ArthurWhiteCommander</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Dec 2009</b></div>
            <div>Posts: <b>2,912</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#5</span>
            <span class="post-time">Oct 13, 2013, 02:56 JST</span>
        </div>
        <div class="post-content">
            <p>Arthur White cracking his knuckles with his giant lance and telling the squad <i>"In order to fight for freedom, break the cage"</i> was so badass.</p>
            <p>He's giving massive veteran mentor energy. And then Klaus just deadpan asking if he wants to jump in right now LOL</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #6 - NodeCoreTactics =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-nodeomega"/></svg>
        <a href="#" class="username">NodeCoreTactics</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Apr 2010</b></div>
            <div>Posts: <b>1,850</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#6</span>
            <span class="post-time">Oct 13, 2013, 03:05 JST</span>
        </div>
        <div class="post-content">
            <p>That base defense scene was peak mecha sakuga! When the 3 FRM mechs launched out and tag-teamed the wheel monster mid-air, smashing it into the skyscraper with <b>"K.O.!"</b> flashing on screen... Studio Burst went all out!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #7 - GamerBro_omi214 =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-vermilionowl"/></svg>
        <a href="#" class="username">GamerBro_omi214</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Sep 2012</b></div>
            <div>Posts: <b>425</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#7</span>
            <span class="post-time">Oct 13, 2013, 03:15 JST</span>
        </div>
        <div class="post-content">
            <p>lmao omi214 getting sliced by a QTE button combo (A B B C) from a golf cart and getting a huge <i>"omi214 IS ELIMINATED"</i> pop-up sending him back to the lobby XD</p>
            <p>Getting rekt on stream like that is pure pain RIP :v</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #8 - AbigailGunKata_Fan =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-abigailfan"/></svg>
        <a href="#" class="username">AbigailGunKata_Fan</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>156</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#8</span>
            <span class="post-time">Oct 13, 2013, 03:26 JST</span>
        </div>
        <div class="post-content">
            <p>Abigail and Grayson in the jail cell was awesome. First the guard calls them pigs, and Abigail just aims her flame guns point blank at the wall to threaten him into opening the door XDD</p>
            <p>Grayson didn't even flinch, he knew she meant business!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #9 - KlausDeadpan_Fan =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-cyberlunchbox"/></svg>
        <a href="#" class="username">KlausDeadpan_Fan</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Aug 2013</b></div>
            <div>Posts: <b>107</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#9</span>
            <span class="post-time">Oct 13, 2013, 03:38 JST</span>
        </div>
        <div class="post-content">
            <p>Klaus is so funny with his deadpan responses. Arthur gives a whole passionate speech about breaking cages, and Klaus just stares at him like <i>"Are you done talking?"</i> lol</p>
            <p>The FRM squad dynamic is great!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #10 - TakuyaMangaBro =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-vhssamurai"/></svg>
        <a href="#" class="username">TakuyaMangaBro</a>
        <div class="rank">Anime Addict</div>
        <div class="user-meta">
            <div>Joined: <b>Apr 2009</b></div>
            <div>Posts: <b>4,210</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#10</span>
            <span class="post-time">Oct 13, 2013, 03:52 JST</span>
        </div>
        <div class="post-content">
            <p>Sora overthinking and secretly taking a picture of the blueprint on his phone right in front of Arthur White had me dying XD</p>
            <p>Dude is trying so hard to be a tactical mastermind!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #11 - Nishikawa_OP_Hype =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-drowsyvhs"/></svg>
        <a href="#" class="username">Nishikawa_OP_Hype</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Feb 2012</b></div>
            <div>Posts: <b>432</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#11</span>
            <span class="post-time">Oct 13, 2013, 04:08 JST</span>
        </div>
        <div class="post-content">
            <p>TAKANORI NISHIKAWA IS SINGING THE OP???</p>
            <p>The moment <i>"Human x Inhuman"</i> kicked in when the sniper aimed from the bushes had me jumping out of my chair! T.M.Revolution levels of hype!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #12 - Planetation_Lore_Head =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-ciphercaramel"/></svg>
        <a href="#" class="username">Planetation_Lore_Head</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>78</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#12</span>
            <span class="post-time">Oct 13, 2013, 04:25 JST</span>
        </div>
        <div class="post-content">
            <p>The map reveal was insane. Shell 0 is just a tiny strip at the center, surrounded by 5 whole outer shells, skybelts, and the Abysslayer o_O</p>
            <p>Planetation is way bigger than we thought!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #13 - Grayson_Ignition_DualBlades =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-toonblock"/></svg>
        <a href="#" class="username">Grayson_Ignition_DualBlades</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Apr 2011</b></div>
            <div>Posts: <b>660</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#13</span>
            <span class="post-time">Oct 13, 2013, 04:42 JST</span>
        </div>
        <div class="post-content">
            <p>Grayson igniting his Crucible Dual Blades to cover Sora's flank was so smooth.</p>
            <p>He pretends he doesn't care, but he always steps up to protect the squad. Best bro in the show hands down!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #14 - MiyukiKagemitsuStan =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-kaichouenjoyer"/></svg>
        <a href="#" class="username">MiyukiKagemitsuStan</a>
        <div class="rank">Newbie</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>42</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#14</span>
            <span class="post-time">Oct 13, 2013, 05:01 JST</span>
        </div>
        <div class="post-content">
            <p>Miyuki standing on that pile of rubble watching all the other squads get pushed into her trap was so intimidating XD</p>
            <p>She didn't even have to swing her sword, just let the storm do the work!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #15 - Lisa_Minko_Viewer =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-bostonbean"/></svg>
        <a href="#" class="username">Lisa_Minko_Viewer</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Jun 2012</b></div>
            <div>Posts: <b>324</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#15</span>
            <span class="post-time">Oct 13, 2013, 05:24 JST</span>
        </div>
        <div class="post-content">
            <p>Lisa's POV mid-episode was great! Minko is complaining about scrap bots having no treasure, while Lisa is casually making mall plans for 10am after the match LOL</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #16 - NodeCore_DropIn_Boy =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-hyperneko"/></svg>
        <a href="#" class="username">NodeCore_DropIn_Boy</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Nov 2011</b></div>
            <div>Posts: <b>508</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#16</span>
            <span class="post-time">Oct 13, 2013, 05:45 JST</span>
        </div>
        <div class="post-content">
            <p>The NodeCore drop-in from the sky right into the standoff between Sora and Miyuki was EPIC ^_^</p>
            <p>Saved Sora just as Lisa locked onto him with her scope!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #17 - Cliffhanger_Hype_Bro =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-chibicomet"/></svg>
        <a href="#" class="username">Cliffhanger_Hype_Bro</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>May 2011</b></div>
            <div>Posts: <b>1,118</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#17</span>
            <span class="post-time">Oct 13, 2013, 06:12 JST</span>
        </div>
        <div class="post-content">
            <p>WHY DID IT CUT TO BLACK AT 1:82:46 ON THE TIMER T_T</p>
            <p>Sunday cannot come fast enough!! Also super hyped for the cool biker lady teased in the Ep 3 preview!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #18 - SubOverDub_Gamer =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-guestsignal"/></svg>
        <a href="#" class="username">SubOverDub_Gamer</a>
        <div class="rank">Newbie</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>19</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#18</span>
            <span class="post-time">Oct 13, 2013, 06:35 JST</span>
        </div>
        <div class="post-content">
            <p>Sub over dub as always! Glad I watch on YAL, no way I could wait for the AdultDrift dub in 2015 lol</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #19 - Sawashiro_ED_Enjoyer =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-hollowtoast"/></svg>
        <a href="#" class="username">Sawashiro_ED_Enjoyer</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Jul 2010</b></div>
            <div>Posts: <b>2,469</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#19</span>
            <span class="post-time">Oct 13, 2013, 07:02 JST</span>
        </div>
        <div class="post-content">
            <p>The ED <i>"24 Hours Everyday"</i> by Miyuki Sawashiro is so good. Has that sweet nostalgic 2000s anime melody.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #20 - SakugaThreadZero =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-zeroframe"/></svg>
        <a href="#" class="username">SakugaThreadZero</a>
        <div class="rank">Database Contributor</div>
        <div class="user-meta">
            <div>Joined: <b>Nov 2009</b></div>
            <div>Posts: <b>5,904</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#20</span>
            <span class="post-time">Oct 13, 2013, 07:30 JST</span>
        </div>
        <div class="post-content">
            <p>Rewatched the golf cart chase sakuga frame-by-frame. When Grayson cuts the steering wheel left, the chassis weight tilts on the suspension before the drift starts. Studio Burst animator attention to physics detail is elite!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

</div>

<!-- BOTTOM PAGINATION -->
<div class="pagination bottom">
    Page 1 of 48 &nbsp;
    <span class="nav">&laquo; Previous</span>
    <span class="current">1</span>
    <a href="ep2_page2.html">2</a>
    <a href="ep2_page3.html">3</a>
    <span class="gap">...</span>
    <a href="ep2_page47.html">47</a>
    <a href="ep2_page48.html">48</a>
    <a href="ep2_page2.html" class="nav">Next &raquo;</a>
</div>

<!-- REPLY BOX -->
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
                <a href="#">SoraGauthier_Fanboy</a>, <a href="#">BenSmytheGaming</a>,
                <a href="#">GraysonRothenbergStan</a>, <a href="#">ArthurWhiteCommander</a>,
                <a href="#">NodeCoreTactics</a>, <a href="#">GamerBro_omi214</a>,
                <a href="#">KlausDeadpan_Fan</a>, <a href="#">TakuyaMangaBro</a>,
                <a href="#">Nishikawa_OP_Hype</a>, <a href="#">Grayson_Ignition_DualBlades</a>,
                <a href="#">NodeCore_DropIn_Boy</a>, <a href="#">Cliffhanger_Hype_Bro</a>
            </div>
        </div>
    </div>

    <div class="side-card">
        <div class="side-head">Hot Subthreads (this episode)</div>
        <div class="side-body">
            <ul>
                <li><a href="#">Sora's MetaCode bloody nose charge &mdash; "go all in!" hype</a> (254 replies)</li>
                <li><a href="#">Ben on golf cart roof screaming "OH SHI! DIE!!!" meme thread</a> (212 replies)</li>
                <li><a href="#">Grayson 90mph golf cart driving &amp; "dumbass" banter</a> (189 replies)</li>
                <li><a href="#">Arthur White &mdash; "In order to fight for freedom, break the cage"</a> (195 replies)</li>
                <li><a href="#">Golf Cart Chase QTE (A B B C) &mdash; omi214 IS ELIMINATED thread</a> (176 replies)</li>
                <li><a href="#">FRM Base Defense Mechs vs Wheel Monster &mdash; 3DCG sakuga</a> (210 replies)</li>
                <li><a href="#">Security Officer vs Abigail &amp; Grayson jail cell escape</a> (143 replies)</li>
                <li><a href="#">PLANETATION MAP IS HUGE! Shells 0 to 5, Skybelts, Abysslayer</a> (305 replies)</li>
                <li><a href="#">Lisa &amp; Minko Outer Ring chase &amp; 27-sec camera burst</a> (168 replies)</li>
                <li><a href="#">NodeCore drop-in &amp; 1:82:46 timer cliffhanger thread</a> (280 replies)</li>
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

with open(out_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Successfully generated clean human forum posts with male/boy character focus: {out_path}")
