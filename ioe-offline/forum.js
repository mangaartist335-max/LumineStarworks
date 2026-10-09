// Spoiler toggle
document.querySelectorAll('.spoiler-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var sp = btn.closest('.spoiler');
        if (sp.dataset.hidden === 'true') {
            sp.dataset.hidden = 'false';
            btn.textContent = 'Hide';
        } else {
            sp.dataset.hidden = 'true';
            btn.textContent = 'Show';
        }
    });
});

// =========================================================================
// Reply box wiring
// =========================================================================
(function () {
    var box = document.getElementById('reply');
    if (!box) return;

    var body = box.querySelector('.reply-box-body');
    if (!body) return;

    // ---------------------------------------------------------------------
    // Insert "Posting as ___ [change]" line above the textarea
    // ---------------------------------------------------------------------
    function randomGuestName() {
        return 'GuestUser_' + Math.floor(1000 + Math.random() * 9000);
    }
    var guestAvatars = [
        'av-guestfirework', 'av-guestink', 'av-guestcone', 'av-guestsignal',
        'av-day01', 'av-hyperneko', 'av-ciphercaramel', 'av-calsparrow'
    ];
    function avatarForName(name) {
        var total = 0;
        for (var i = 0; i < name.length; i += 1) total += name.charCodeAt(i);
        return guestAvatars[total % guestAvatars.length];
    }
    var storedName = null;
    try {
        storedName = window.localStorage && localStorage.getItem('yal_guest_name');
    } catch (e) {}
    var guestName = storedName || randomGuestName();

    var idLine = document.createElement('div');
    idLine.className = 'reply-identity';
    idLine.style.cssText =
        'font-size:12px;color:#6b6258;margin-bottom:7px;padding:5px 7px;' +
        'background:#fff7e6;border:1px solid #d5c8b4;';
    idLine.innerHTML =
        'Posting as <b id="reply-name"></b> ' +
        '<a href="#" id="reply-name-edit" style="color:#195956;text-decoration:none;">[change]</a>';
    body.insertBefore(idLine, body.firstChild);
    var nameSpan = idLine.querySelector('#reply-name');
    nameSpan.textContent = guestName;
    idLine.querySelector('#reply-name-edit').addEventListener('click', function (e) {
        e.preventDefault();
        var next = prompt('Pick a forum username:', guestName);
        if (next && next.trim()) {
            guestName = next.trim().slice(0, 32);
            nameSpan.textContent = guestName;
            try { localStorage.setItem('yal_guest_name', guestName); } catch (e) {}
        }
    });

    var ta = box.querySelector('textarea');
    var btns = box.querySelectorAll('.reply-box-toolbar .btn');
    var previewBtn = btns[0];
    var postBtn = btns[1];

    // ---------------------------------------------------------------------
    // Track running guest-post counter across the session
    // ---------------------------------------------------------------------
    var sessionPostCounter = 1114; // total replies in the thread is 1,113

    // ---------------------------------------------------------------------
    // Build a post DOM node from raw text
    // ---------------------------------------------------------------------
    function nowJST() {
        var d = new Date();
        // local time, then label as JST for the in-universe vibe
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() +
            ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' JST';
    }

    function escapeHtml(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function paragraphify(raw) {
        // turn double newlines into paragraph breaks, single newlines into <br>
        var safe = escapeHtml(raw);
        var paras = safe.split(/\n\s*\n/);
        return paras
            .map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; })
            .join('');
    }

    function buildPostNode(name, content, postNum) {
        var wrap = document.createElement('div');
        wrap.className = 'post user-reply';
        var avatarId = avatarForName(name);
        wrap.innerHTML =
            '<div class="post-user">' +
            '  <svg class="avatar" viewBox="0 0 80 80"><use href="avatars.svg#' + avatarId + '"/></svg>' +
            '  <a href="#" class="username">' + escapeHtml(name) + '</a>' +
            '  <div class="rank">Newbie</div>' +
            '  <div class="user-meta">' +
            '    <div>Joined: <b>Today</b></div>' +
            '    <div>Posts: <b>1</b></div>' +
            '    <div class="status-online">Online</div>' +
            '  </div>' +
            '</div>' +
            '<div class="post-body">' +
            '  <div class="post-head">' +
            '    <span class="post-num">#' + postNum + '</span>' +
            '    <span class="post-time">' + nowJST() + '</span>' +
            '    <span class="post-yours" style="margin-left:8px;color:#1f5fa0;font-size:10px;font-weight:bold;">[YOUR REPLY]</span>' +
            '  </div>' +
            '  <div class="post-content">' + paragraphify(content) + '</div>' +
            '  <div class="post-actions">' +
            '    <a href="#">Quote</a> <a href="#">Reply</a> ' +
            '    <a href="#" class="report">Report</a>' +
            '  </div>' +
            '</div>';
        return wrap;
    }

    // ---------------------------------------------------------------------
    // Preview behaviour: pop up a transient preview above the textarea
    // ---------------------------------------------------------------------
    var previewEl = null;
    if (previewBtn) {
        previewBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var raw = (ta.value || '').trim();
            if (!raw) {
                alert('Type something first!');
                return;
            }
            if (previewEl) previewEl.remove();
            previewEl = document.createElement('div');
            previewEl.className = 'reply-preview';
            previewEl.style.cssText =
                'margin-bottom:9px;padding:9px 11px;background:#fff8df;' +
                'border:1px solid #d5c8b4;font-size:12px;color:#2d2a26;';
            previewEl.innerHTML =
                '<div style="font-weight:bold;margin-bottom:4px;color:#873f1f;">' +
                'Preview (this is not posted yet):</div>' +
                paragraphify(raw);
            body.insertBefore(previewEl, idLine);
        });
    }

    // ---------------------------------------------------------------------
    // Post Reply: append a real-looking post before the reply box
    // ---------------------------------------------------------------------
    if (postBtn) {
        postBtn.addEventListener('click', function (e) {
            e.preventDefault();
            var raw = (ta.value || '').trim();
            if (!raw) {
                alert('You can\'t post an empty reply.');
                return;
            }
            if (raw.length > 4000) {
                alert('Replies are capped at 4000 characters.');
                return;
            }

            var post = buildPostNode(guestName, raw, sessionPostCounter);
            sessionPostCounter += 1;

            box.parentNode.insertBefore(post, box);

            // increment the "Replies" thread-meta counter if we can find it
            try {
                var rows = document.querySelectorAll('.thread-meta tr');
                rows.forEach(function (tr) {
                    var label = tr.querySelector('td.label');
                    if (label && label.textContent.trim().toLowerCase() === 'replies') {
                        var cell = tr.querySelectorAll('td')[1];
                        var b = cell.querySelector('b');
                        if (b) {
                            var n = parseInt(b.textContent.replace(/,/g, ''), 10);
                            if (!isNaN(n)) {
                                n += 1;
                                b.textContent = n.toLocaleString('en-US');
                            }
                        }
                    }
                });
            } catch (e) {}

            ta.value = '';
            if (previewEl) { previewEl.remove(); previewEl = null; }

            // smooth scroll to new post
            post.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // brief flash highlight
            var origBg = post.style.backgroundColor;
            post.style.backgroundColor = '#fff0bd';
            setTimeout(function () {
                post.style.transition = 'background-color 1.2s ease';
                post.style.backgroundColor = origBg || '';
            }, 50);
        });
    }
})();
