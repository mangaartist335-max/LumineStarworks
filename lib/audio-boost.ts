// Built apps make their own Web Audio sound effects, and models tend to
// pick very quiet volumes. Rather than hoping every build gets it right,
// this tiny script runs first inside every built app (preview and download)
// and routes anything sent to the speakers through a volume boost plus a
// limiter, so sounds are reliably loud without crackling. Mute buttons keep
// working: zero times any boost is still zero.

const BOOST = 3.2;

const BOOST_SCRIPT = `<script>(function(){try{
var AC=window.AudioContext||window.webkitAudioContext;if(!AC||!window.AudioNode)return;
var connect=AudioNode.prototype.connect;var chains=new WeakMap();
function chainFor(ctx){var b=chains.get(ctx);if(b)return b;
b=ctx.createGain();b.gain.value=${BOOST};
var l=ctx.createDynamicsCompressor();l.threshold.value=-10;l.knee.value=4;l.ratio.value=16;l.attack.value=0.002;l.release.value=0.15;
connect.call(b,l);connect.call(l,ctx.destination);chains.set(ctx,b);return b;}
AudioNode.prototype.connect=function(dest){
if(dest&&this.context&&dest===this.context.destination){arguments[0]=chainFor(this.context);}
return connect.apply(this,arguments);};
}catch(e){}})();</script>`;

const MARKER = "data-buildbrief-audio-boost";

/** Adds the volume booster to a built app's HTML (once). */
export function withAudioBoost(html: string): string {
  if (html.includes(MARKER)) return html;
  const script = BOOST_SCRIPT.replace("<script>", `<script ${MARKER}>`);
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch && headMatch.index !== undefined) {
    const at = headMatch.index + headMatch[0].length;
    return html.slice(0, at) + script + html.slice(at);
  }
  const htmlMatch = html.match(/<html[^>]*>/i);
  if (htmlMatch && htmlMatch.index !== undefined) {
    const at = htmlMatch.index + htmlMatch[0].length;
    return html.slice(0, at) + script + html.slice(at);
  }
  return script + html;
}
