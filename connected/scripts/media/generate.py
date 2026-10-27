"""Regenerates every piece of original media: npm run media."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import common  # noqa: E402
import art  # noqa: E402
import docs  # noqa: E402
import manga  # noqa: E402
import music  # noqa: E402
import radio  # noqa: E402
import creators  # noqa: E402
import snapshots  # noqa: E402
import videos  # noqa: E402
import wallpapers  # noqa: E402

if __name__ == "__main__":
    wallpapers.main()  # videos use the wallpapers, so they go first
    videos.main()
    creators.main()
    music.main()
    radio.main()
    manga.main()
    docs.main()
    art.main()
    snapshots.main()
    common.save_manifest()
    print("done")
