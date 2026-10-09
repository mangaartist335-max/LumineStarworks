import os

base_dir = r"c:\Users\xande\Downloads\YAL (YourAnimeList) Stuff"
out_path = os.path.join(base_dir, "yal_impact_of_eden_ep3_2013.html")
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
    <title>Impact of Eden Episode 3 Discussion - YourAnimeList</title>
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
    <span>Episode 3 Discussion</span>
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
    Page 1 of 54 &nbsp;
    <span class="nav">&laquo; Previous</span>
    <span class="current">1</span>
    <a href="ep3_page2.html">2</a>
    <a href="ep3_page3.html">3</a>
    <span class="gap">...</span>
    <a href="ep3_page53.html">53</a>
    <a href="ep3_page54.html">54</a>
    <a href="ep3_page2.html" class="nav">Next &raquo;</a>
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
            <div>Posts: <b>12,504</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#1</span>
            <span class="post-time">Oct 20, 2013, 02:30 JST</span>
        </div>
        <div class="post-content" style="background:#fff8e0;border-left:3px solid #ffd54a;padding:8px 10px;">
            <p><b>Episode 3 ("Battle Circle") is now available.</b></p>
            <p>Please keep discussion focused on Episode 3.<br>
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

<!-- =================== POST #2 - SakugaThreadZero =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-zeroframe"/></svg>
        <a href="#" class="username">SakugaThreadZero</a>
        <div class="rank">Database Contributor</div>
        <div class="user-meta">
            <div>Joined: <b>Nov 2009</b></div>
            <div>Posts: <b>5,952</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#2</span>
            <span class="post-time">Oct 20, 2013, 02:34 JST</span>
        </div>
        <div class="post-content">
            <p><b>ACTION DIRECTOR YUSUKE KAGURA IS A GOD. SAKUGA OF THE YEAR.</b></p>
            <p>I just finished rewatching Grayson vs IgniteCOD_Clutch at 0.5x speed and I'm losing my mind. Look at the martial arts fundamentals Kagura put into Grayson's choreography: it's not generic floaty anime sword-flailing. It's grounded <b>BOXING JABS AND STREET KICKS</b>:</p>
            <ul>
                <li>When Ignite slides, Grayson drops his hips and stamps a stiff low kick right into the knee to kill the slide.</li>
                <li>When Ignite tries to aim his SMG, Grayson delivers a sharp front kick to break his aim stance.</li>
                <li>When Ignite deploys a build panel for cover, Grayson doesn't waste magic &mdash; he plants his heel into a heavy, devastating axe kick that splits the panel in half!</li>
                <li>And that spinning back kick timed to Ignite's teleport exit... the anticipation animation was immaculate!</li>
            </ul>
            <p>He held the Crucible flames until the end like punctuation marks. Hands and kicks won the space &mdash; Crucibles cashed out the damage! And that three-frame impact hold on <i>Lethal Crucible: Red Divide</i>? Absolutely unreal compositing from Studio Burst.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #3 - IgniteCOD_Sweat =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-rawrxd"/></svg>
        <a href="#" class="username">IgniteCOD_Sweat</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Mar 2013</b></div>
            <div>Posts: <b>222</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#3</span>
            <span class="post-time">Oct 20, 2013, 02:38 JST</span>
        </div>
        <div class="post-content">
            <p>IgniteCOD_Clutch is literally every toxic Modern Warfare 2 sweat in existence lmfaoooo</p>
            <p>The guy throws down launch pads, spams sticky mines, quickscopes with his rifle, and furiously rage-types in floating text chat: <i>"??? Who the f&mdash;? Get off me!"</i> and <i>"Look at this, bitch!"</i> with his drones out XD</p>
            <p>And Grayson doesn't even say a word &mdash; he just walks straight through the gunfire with Gojo spacing arrogance and Ichigo forward pressure, breaks Ignite's machete with his bare boot, and Ignite's final dying message before dissolving into golden EXP is: <i>"damn... nice..."</i>. Burst writers definitely play competitive multiplayer games, this parody was too accurate!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #4 - NodeCorePilot =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-mecharonin"/></svg>
        <a href="#" class="username">NodeCorePilot</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Aug 2010</b></div>
            <div>Posts: <b>2,245</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#4</span>
            <span class="post-time">Oct 20, 2013, 02:43 JST</span>
        </div>
        <div class="post-content">
            <p><b>BEN SMYTHE VS MAXINO WAS THE MANLIEST FIGHT OF 2013.</b></p>
            <p>Maxino turning the entire circular fossil basin into an explosive firework minefield with delayed rockets and launch zones was crazy. But Ben's response?! Switching between Machine Gun to snipe missiles out of the air, Flight Mode to redirect the blast recoil, and Drill Mode to parry Maxino's shield!</p>
            <p>And that 45-second Grand Finale countdown at the end: Ben is at 96% heat, coughing blood, Maxino yells <i>"You missed one!"</i>, and Ben just grins: <i>"Oh yeah!? You wish!"</i> and <b>RUNS STRAIGHT INTO THE POINT-BLANK BLAST</b>! The explosion catches his back, blood and sparks tear across the screen, and he drives that roaring NodeCore drill right through Maxino into the fossil ridge screaming: <b>"HERE'S YOUR L!"</b></p>
            <p>Then collapsing face-first in the mud at 100% heat murmuring <i>"Scientific reaction..."</i>, whacking his smoking engine with a wrench, and getting right back up: <i>"You've got five more minutes in you. That wasn't a question."</i> Ben is an absolute legend.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #5 - SoraGauthier_Fanboy =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-starcircuit"/></svg>
        <a href="#" class="username">SoraGauthier_Fanboy</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>175</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#5</span>
            <span class="post-time">Oct 20, 2013, 02:49 JST</span>
        </div>
        <div class="post-content">
            <p>Can we talk about how smart <b>Sora vs Nero</b> was? Nero wasn't a brute boss, he was an analytical route-controller who used a 3-color lane system (blue = move, yellow = delay, red = punish). He wasn't tracking Sora's speed &mdash; he was tracking Sora's <i>habits</i>, counting on Sora's protective instinct to rush in whenever Abigail's route was threatened!</p>
            <p>When Sora realizes that flash-stepping and rushing are giving Nero all his predictive data, he doesn't pull out a sudden power-up. He breaks the calculation by taking an <b>ordinary, human, pathetic step</b>:</p>
            <div class="quote">
                <div class="quote-head">The tactical narration:</div>
                <div class="quote-body">
                    <i>"Nero's prediction was perfect. That was why it failed. It predicted the Sora who had already panicked. The Sora in front of him now had learned the cruelest survival lesson available: running and surviving are not the same action."</i>
                </div>
            </div>
            <p>And look at the sheer kinetic grit right before that when Ben launches him in: Sora falls into the ground, rolls through the dirt to absorb the impact, immediately pushes back up, and charges straight into Nero without losing an ounce of momentum. It wasn't played for laughs at all &mdash; you can feel his raw determination to close the distance!</p>
            <p>Then shattering the route line beneath Nero's feet, making the cat-ears face, tapping his forehead with the 'L' sign, whispering <i>"Later~"</i> and blitzing away! Mariya Ise brought so much charisma to that sequence :3</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #6 - AbigailFanAlready =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-abigailfan"/></svg>
        <a href="#" class="username">AbigailFanAlready</a>
        <div class="rank">Member</div>
        <div class="user-meta">
            <div>Joined: <b>May 2012</b></div>
            <div>Posts: <b>548</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#6</span>
            <span class="post-time">Oct 20, 2013, 02:55 JST</span>
        </div>
        <div class="post-content">
            <p><b>ABIGAIL VS MIYUKI WAS PURE UNFILTERED HATRED.</b></p>
            <p>Zero friendly anime tournament vibes. Look at the dialogue when their weapons locked:</p>
            <div class="quote">
                <div class="quote-head">Duel Dialogue:</div>
                <div class="quote-body">
                    <b>Abigail:</b> "Miyuki, it's been 6 years and you're still hurting everyone! Stop doing this!"<br>
                    <b>Miyuki:</b> "And that's the problem! You're acting as if there are rights to rebel against authority!"<br>
                    <b>Abigail:</b> "This isn't about school, it's about you!"<br>
                    <b>Miyuki:</b> "Do not tell me what to do, you lower caste pig!"<br>
                    <b>Abigail:</b> "Fine then! I'll push it through your brain, b**ch!"
                </div>
            </div>
            <p>Kana Hanazawa and Saori Hayami were screaming with so much venom! And the choreography: Flame Guns vs Zantenzetsuken. When Abigail caught the blade, pulled herself in with the hook cable, and delivered that brutal spin-kick into Miyuki's guard &mdash; the camera zoomed in on Miyuki's forearm trembling from adrenaline and pain. First time in the whole anime Miyuki's composure broke!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #7 - LisaSniperQueen =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-sakurastatic"/></svg>
        <a href="#" class="username">LisaSniperQueen</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Jun 2011</b></div>
            <div>Posts: <b>765</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#7</span>
            <span class="post-time">Oct 20, 2013, 03:01 JST</span>
        </div>
        <div class="post-content">
            <p><b>ECHO VS LISA WAS CATFIGHT OF THE DECADE!!</b></p>
            <p>First Lisa interrupts Margo's screaming sound cannon: <i>"You're mine, pig!!"</i> &mdash; Rina Satou delivering that line gave me actual chills. But then Echo Desmond drops in with that absurd <b>Anchor Armament</b> &mdash; dual blades that transform into twin rotary machine guns, and then combine into that massive double-edged Anchor Greatsword!</p>
            <p>And their dialogue while trading lethal strikes was so petty and hilarious:</p>
            <p>Echo: <i>"Aww, is that your toy to feel important?"</i><br>
            Lisa: <i>"Enough hiding behind the Council!"</i><br>
            Echo: <i>"Congratulations. You got the whole school laughing! Hahahahaha! Burn in h**l!"</i><br>
            Lisa: <i>"...You pig."</i><br>
            Echo: <i>"I'm staring at how UGLY your shoes look."</i><br>
            Lisa: <i>"Nobody cares! Garbage!!"</i></p>
            <p>And they literally ended the clash by double drop-kicking each other across the arena! Need their rematch animated immediately.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #8 - NekoToast92 =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-nekotoast"/></svg>
        <a href="#" class="username">NekoToast92</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Mar 2010</b></div>
            <div>Posts: <b>925</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#8</span>
            <span class="post-time">Oct 20, 2013, 03:07 JST</span>
        </div>
        <div class="post-content">
            <p>Between all the god-tier sakuga, Minko vs Likko was the funniest physical comedy I've seen in anime all year XDDDD</p>
            <p>Likko is running along the wall like an elegant classical ballerina firing her rhythm shotgun to fast piano runs (<i>"4e corde! Tempo miracle ultra-rapide!"</i>)... and Minko is literally tripping over her own boots, sliding down the hill on her face, and screaming <i>"I meant to do that!... I didn't mean to do that!"</i></p>
            <p>Then her scythe catches the giant route wheel, spins her 360 degrees like a human propeller, launches her across the canyon into a dead tree, and she ends up chasing the golf cart on foot! When she tried to board the cart and the scythe shaft smacked Grayson right behind the head: <b>"OW! DAMMIT, MINKO!"</b>... Okamoto's rage scream had me crying laughing!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #9 - GraysonSus_NotSus =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-kiranotkira"/></svg>
        <a href="#" class="username">GraysonSus_NotSus</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Sep 2011</b></div>
            <div>Posts: <b>648</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#9</span>
            <span class="post-time">Oct 20, 2013, 03:13 JST</span>
        </div>
        <div class="post-content">
            <p>Ben and Grayson in the cart were pure comedy gold the entire episode:</p>
            <p>Ben: <i>"GRAYSON, THIS THING'S EATING ITS OWN AXLES &mdash; WE NEED NINETY, WE'RE AT SIXTY-THREE!"</i><br>
            Grayson: <i>"Sixty-three is a funeral march! Throttle! We only get ONE lane &mdash; one moment &mdash; one heartbeat &mdash; before those idiots flood it!"</i><br>
            Ben: <i>"DEAD END IS GOOD. THAT MEANS WE CAN GET MORE SCIENTIFIC REACTIONS!"</i><br>
            Grayson: <i>"I SWEAR IF WE DIE, I'M GONNA STRANGLE YOU&mdash;"</i></p>
            <p>And then Grayson driving the broken cart through the sky while Sora anchors the front axle with his MetaCode threads and Ben drills obstacles... it's like Mad Max met Gurren Lagann!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #10 - ShounenLifer_VHS =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-vhssamurai"/></svg>
        <a href="#" class="username">ShounenLifer_VHS</a>
        <div class="rank">Anime Addict</div>
        <div class="user-meta">
            <div>Joined: <b>Apr 2009</b></div>
            <div>Posts: <b>4,240</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#10</span>
            <span class="post-time">Oct 20, 2013, 03:20 JST</span>
        </div>
        <div class="post-content">
            <p>Sora jumping out of the airborne cart, spinning into a high-speed MetaCode Beyblade right into Kieran and William, but explicitly avoiding Echo, Miyuki, and Likko because he respects women is the funniest character detail of the season XDDDD</p>
            <p>He literally carved a path through the council guards with pure momentum! And the bro handshake before Ben launched him: <i>"See that son of a bitch over there? I'm gonna launch you at him!"</i> followed by Sora getting a bloody nose mid-flight... Sora has the best scrappy shounen energy.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #11 - StormWallTheory =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-stormwalltheory"/></svg>
        <a href="#" class="username">StormWallTheory</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Jan 2010</b></div>
            <div>Posts: <b>3,088</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#11</span>
            <span class="post-time">Oct 20, 2013, 03:27 JST</span>
        </div>
        <div class="post-content">
            <p>THAT CLIFFHANGER WHAT THE ACTUAL HELL?!?!?!</p>
            <p>Margo drops that little blue sphere behind her broken sound cannon, Andreas screams through the comms <i>"Grayson, don't land there!"</i>, the white route line turns black and literally FOLDS like origami, and a void rift opens beneath the entire battlefield?!</p>
            <p>Sora and Abigail reaching out for each other, their fingertips missing by two centimeters, and then the screen flashes white and <b>EVERYONE GETS SUCKED IN</b>??</p>
            <p>Every single UI card reading <b>SIGNAL LOST</b> at once: Sora, Grayson, Ben, Abigail, Lisa, Minko, even Miyuki, Echo, and Likko! They wiped the entire playing field in 10 seconds!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #12 - NovaFanPixel =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-moonlitpixel"/></svg>
        <a href="#" class="username">NovaFanPixel</a>
        <div class="rank">Database Contributor</div>
        <div class="user-meta">
            <div>Joined: <b>Mar 2010</b></div>
            <div>Posts: <b>6,260</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#12</span>
            <span class="post-time">Oct 20, 2013, 03:34 JST</span>
        </div>
        <div class="post-content">
            <p><b>KLAUS CALLING IN NOVA CONFIRMED!!</b></p>
            <p>When the scene cut to Arthur White, Klaus, and Andreas staring at the monitors showing <b>"Egg status revival: 87%"</b> and Klaus went: <i>"Great, now we've lost our only chance of victory. I'm calling in Nova so that egg doesn't destroy the damn continent."</i></p>
            <p>Nova is finally entering the field! Remember her quote in Ep 1 about standing up even if we're all morally wrong? She's definitely FRM's top-tier operative. And if the World Tree Egg is at 87% in episode 3, episode 4 is going to be an apocalyptic catastrophe!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #13 - TokuFanMango =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-robomango"/></svg>
        <a href="#" class="username">TokuFanMango</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>Feb 2011</b></div>
            <div>Posts: <b>942</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#13</span>
            <span class="post-time">Oct 20, 2013, 03:41 JST</span>
        </div>
        <div class="post-content">
            <p>That post-credits scene with Emiko had me screaming!!</p>
            <p>Arthur White gets a phone call from a woman teasing him: <i>"Whitie~ You there~?"</i><br>
            Arthur: <i>"Emiko! What a surprise! How was the trip to Shell 2?"</i><br>
            Emiko: <i>"Eh, joined a fashion show, met random people, anyway what's the situation?"</i><br>
            Arthur: <i>"It's at HQ, you kn&mdash;"</i><br>
            Emiko: <i>"Take a far right and identify yourself as a FRM acting CEO."</i></p>
            <p>SHE IS THE ACTING CEO OF FRM WHILE WALKING RUNWAYS IN SHELL 2?! The female characters in Eden are written so unapologetically in charge, it's amazing.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #14 - ED_Appreciator =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-chibicomet"/></svg>
        <a href="#" class="username">ED_Appreciator</a>
        <div class="rank">Forum Regular</div>
        <div class="user-meta">
            <div>Joined: <b>May 2011</b></div>
            <div>Posts: <b>1,135</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#14</span>
            <span class="post-time">Oct 20, 2013, 03:48 JST</span>
        </div>
        <div class="post-content">
            <p>Miyuki Sawashiro singing the ED <b>"24 Hours Everyday"</b> is the coziest, most bittersweet theme of Fall 2013 <3</p>
            <p>The visuals showing Abigail tying her hair in the morning, buying bread at the bakery, looking at rain through the window, contrasted with her covered in soot holding heavy guns in Planetation... It hits right in the heart. The acoustic guitar vibe is so nostalgic.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #15 - KaichouEnjoyer =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-kaichouenjoyer"/></svg>
        <a href="#" class="username">KaichouEnjoyer</a>
        <div class="rank">Anime Addict</div>
        <div class="user-meta">
            <div>Joined: <b>Aug 2011</b></div>
            <div>Posts: <b>2,198</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#15</span>
            <span class="post-time">Oct 20, 2013, 03:54 JST</span>
        </div>
        <div class="post-content">
            <p>The mid-episode commercial break eyecatchers!! That fire logo wipe with Andreas looking smug with his collar up on the first half, and then Miyuki's cold side-profile before the golf cart took flight!</p>
            <p>Even the commercial bumpers have movie-level presentation. Studio Burst is putting everything on the line with this show.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #16 - 3EpisodeRule =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-3eprule"/></svg>
        <a href="#" class="username">3EpisodeRule</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Apr 2010</b></div>
            <div>Posts: <b>1,550</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#16</span>
            <span class="post-time">Oct 20, 2013, 04:01 JST</span>
        </div>
        <div class="post-content">
            <p><b>3-Episode Test Verdict: AOTS CONTENDER.</b></p>
            <p>Look at the variety of combat styles in this single episode:</p>
            <ul>
                <li>Grayson: Pure boxing footwork, checking slides with low kicks, axe kicks, Gojo spacing arrogance</li>
                <li>Ben: High-risk heat management, point-blank explosions, NodeCore drill power</li>
                <li>Sora: Route reading, patience under pressure, ordinary human step counterplay</li>
                <li>Abigail: Aggressive Flame Gun rushdown &amp; hook line mobility</li>
                <li>Lisa: Cold tactical focus scan &amp; terrain denial</li>
                <li>Minko: Slapstick momentum &amp; accidental physics parries</li>
            </ul>
            <p>Nobody fights the same way. Every character has a completely distinct physical identity. Burst debut of the decade!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #17 - HirotoHiro53 =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-sorawatcher"/></svg>
        <a href="#" class="username">HirotoHiro53</a>
        <div class="rank">Newbie</div>
        <div class="user-meta">
            <div>Joined: <b>Oct 2013</b></div>
            <div>Posts: <b>45</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#17</span>
            <span class="post-time">Oct 20, 2013, 04:08 JST</span>
        </div>
        <div class="post-content">
            <p>Preview for Episode 4: <b>"SOUL ANCHOR: The Investigation"</b></p>
            <p><i>"Now that the Egg is now at 87... Percent. There will be an investigation of the source to ensure the safety of the other game world's... Country!"</i></p>
            <p>Where were they teleported?! Are they in the real world now, or a deeper layer of Planetation? Sunday cannot get here fast enough!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #18 - Nishikawa_OP_Hype =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-starcircuit"/></svg>
        <a href="#" class="username">Nishikawa_OP_Hype</a>
        <div class="rank">Anime Addict</div>
        <div class="user-meta">
            <div>Joined: <b>Jul 2011</b></div>
            <div>Posts: <b>1,425</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#18</span>
            <span class="post-time">Oct 20, 2013, 04:15 JST</span>
        </div>
        <div class="post-content">
            <p>I have replayed the OP "Human x Inhuman" twenty times already. Takanori Nishikawa's vocals soaring over those widescreen anime opening visuals... it's pure 2013 hype. Instant CD pre-order.</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #19 - VoidRift_Survivor =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-bluesoda"/></svg>
        <a href="#" class="username">VoidRift_Survivor</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Feb 2010</b></div>
            <div>Posts: <b>1,952</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#19</span>
            <span class="post-time">Oct 20, 2013, 04:22 JST</span>
        </div>
        <div class="post-content">
            <p>Over 1,000 replies on premiere night alone!! YAL forums haven't moved this fast since Titan finished airing last month.</p>
            <p>Impact of Eden is delivering everything we love about 2010s original anime: incredible choreography, hilarious character comedy, killer music, and actual stakes. 5/5 on the poll easily!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

<!-- =================== POST #20 - HollowToast =================== -->
<div class="post">
    <div class="post-user">
        <svg class="avatar" viewBox="0 0 80 80"><use href="#av-hollowtoast"/></svg>
        <a href="#" class="username">HollowToast</a>
        <div class="rank">Senior Member</div>
        <div class="user-meta">
            <div>Joined: <b>Jul 2010</b></div>
            <div>Posts: <b>2,490</b></div>
            <div class="status-online">Online</div>
        </div>
    </div>
    <div class="post-body">
        <div class="post-head">
            <span class="post-num">#20</span>
            <span class="post-time">Oct 20, 2013, 04:30 JST</span>
        </div>
        <div class="post-content">
            <p>Heading to bed with my jaw still on the floor. See everyone on Page 2, let's keep this thread alive all week!</p>
        </div>
        <div class="post-actions">
            <a href="#">Quote</a>
            <a href="#">Reply</a>
            <a href="#" class="report">Report</a>
        </div>
    </div>
</div>

</div><!-- .posts -->

<div class="pagination bottom">
    Page 1 of 54 &nbsp;
    <span class="nav">&laquo; Previous</span>
    <span class="current">1</span>
    <a href="ep3_page2.html">2</a>
    <a href="ep3_page3.html">3</a>
    <span class="gap">...</span>
    <a href="ep3_page53.html">53</a>
    <a href="ep3_page54.html">54</a>
    <a href="ep3_page2.html" class="nav">Next &raquo;</a>
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
                <b>68</b> users<br>
                16 members &middot; 52 guests
            </div>
            <div class="viewers-list">
                <a href="#">SakugaThreadZero</a>, <a href="#">IgniteCOD_Sweat</a>,
                <a href="#">NodeCorePilot</a>, <a href="#">SoraGauthier_Fanboy</a>,
                <a href="#">AbigailFanAlready</a>, <a href="#">LisaSniperQueen</a>,
                <a href="#">NekoToast92</a>, <a href="#">GraysonSus_NotSus</a>,
                <a href="#">ShounenLifer_VHS</a>, <a href="#">StormWallTheory</a>,
                <a href="#">NovaFanPixel</a>, <a href="#">VoidRift_Survivor</a>
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

with open(out_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Successfully updated Episode 3 Page 1 with fight breakdowns: {out_path}")
