import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/features/library/playlist_dialogs.dart';
import 'package:moneybeats/features/library/playlist_providers.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/models/library_query.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/common.dart';
import 'package:moneybeats/widgets/track_tile.dart';

/// Identifies a list of songs the user can open.
sealed class CollectionRef {
  const CollectionRef();

  const factory CollectionRef.likedSongs() = LikedSongsRef;
  const factory CollectionRef.recentlyPlayed() = RecentlyPlayedRef;
  const factory CollectionRef.recentlyAdded() = RecentlyAddedRef;
  const factory CollectionRef.allSongs() = AllSongsRef;
  const factory CollectionRef.album(String albumKey) = AlbumRef;
  const factory CollectionRef.artist(String name) = ArtistRef;
  const factory CollectionRef.playlist(String playlistId) = PlaylistRef;
}

class LikedSongsRef extends CollectionRef {
  const LikedSongsRef();
}

class RecentlyPlayedRef extends CollectionRef {
  const RecentlyPlayedRef();
}

class RecentlyAddedRef extends CollectionRef {
  const RecentlyAddedRef();
}

class AllSongsRef extends CollectionRef {
  const AllSongsRef();
}

class AlbumRef extends CollectionRef {
  const AlbumRef(this.albumKey);
  final String albumKey;
}

class ArtistRef extends CollectionRef {
  const ArtistRef(this.name);
  final String name;
}

class PlaylistRef extends CollectionRef {
  const PlaylistRef(this.playlistId);
  final String playlistId;
}

class _CollectionData {
  const _CollectionData({
    required this.kind,
    required this.title,
    required this.tracks,
    required this.seed,
    required this.icon,
    this.subtitle,
    this.artworkPath,
    this.playlistId,
    this.numbered = false,
    this.emptyMessage = 'No songs here yet.',
    this.missing = false,
  });

  final String kind;
  final String title;
  final String? subtitle;
  final List<Track> tracks;
  final String seed;
  final IconData icon;
  final String? artworkPath;
  final String? playlistId;
  final bool numbered;
  final String emptyMessage;
  final bool missing;

  String get sourceLabel => '$kind · $title';
}

_CollectionData _resolve(WidgetRef ref, CollectionRef collection) {
  switch (collection) {
    case LikedSongsRef():
      return _CollectionData(
        kind: 'Playlist',
        title: 'Liked songs',
        tracks: ref.watch(favoritesProvider),
        seed: 'liked',
        icon: Icons.favorite_rounded,
        emptyMessage: 'Tap the heart on any song and it will show up here.',
      );
    case RecentlyPlayedRef():
      return _CollectionData(
        kind: 'Collection',
        title: 'Recently played',
        tracks: ref.watch(recentlyPlayedProvider),
        seed: 'recent-played',
        icon: Icons.history_rounded,
        emptyMessage: 'Songs you play will appear here.',
      );
    case RecentlyAddedRef():
      return _CollectionData(
        kind: 'Collection',
        title: 'Recently added',
        tracks: ref.watch(recentlyAddedProvider),
        seed: 'recent-added',
        icon: Icons.auto_awesome_rounded,
        emptyMessage:
            'Import some music and your newest songs will appear here.',
      );
    case AllSongsRef():
      return _CollectionData(
        kind: 'Library',
        title: 'All songs',
        tracks: LibraryQuery.sort(
          ref.watch(libraryTracksProvider),
          TrackSort.title,
        ),
        seed: 'all-songs',
        icon: Icons.library_music_rounded,
        emptyMessage: 'Import some music to get started.',
      );
    case AlbumRef(:final albumKey):
      final album = ref.watch(albumByKeyProvider(albumKey));
      if (album == null) return _missing('Album');
      return _CollectionData(
        kind: 'Album',
        title: album.title,
        subtitle: [
          album.artist,
          if (album.year != null) '${album.year}',
        ].join(' · '),
        tracks: album.tracks,
        seed: album.title,
        icon: Icons.album_rounded,
        artworkPath: album.artworkPath,
        numbered: true,
      );
    case ArtistRef(:final name):
      final artist = ref.watch(artistByNameProvider(name));
      if (artist == null) return _missing('Artist');
      return _CollectionData(
        kind: 'Artist',
        title: artist.name,
        subtitle: artist.albumCount == 1
            ? '1 album'
            : '${artist.albumCount} albums',
        tracks: artist.tracks,
        seed: artist.name,
        icon: Icons.person_rounded,
        artworkPath: artist.artworkPath,
      );
    case PlaylistRef(:final playlistId):
      final playlist = ref.watch(playlistByIdProvider(playlistId));
      if (playlist == null) return _missing('Playlist');
      final tracks = ref.watch(playlistTracksProvider(playlistId));
      return _CollectionData(
        kind: 'Playlist',
        title: playlist.name,
        tracks: tracks,
        seed: playlist.name,
        icon: Icons.queue_music_rounded,
        artworkPath: tracks
            .where((t) => t.hasArtwork)
            .map((t) => t.artworkPath)
            .firstOrNull,
        playlistId: playlistId,
        emptyMessage: 'Add songs from their menu with "Add to playlist".',
      );
  }
}

_CollectionData _missing(String kind) => _CollectionData(
  kind: kind,
  title: 'Not found',
  tracks: const [],
  seed: kind,
  icon: Icons.music_off_rounded,
  emptyMessage: 'This ${kind.toLowerCase()} is no longer in your library.',
  missing: true,
);

/// Shows an album, artist, playlist or smart collection.
class CollectionScreen extends ConsumerWidget {
  const CollectionScreen({super.key, required this.collection});

  final CollectionRef collection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = _resolve(ref, collection);
    final audio = ref.read(audioPlayerServiceProvider);
    final queue = ref.watch(queueStateProvider);
    final showPause = ref.watch(
      playbackStatusProvider.select((s) => s.showPause),
    );
    final isThisPlaying = queue.sourceLabel == data.sourceLabel && showPause;
    final theme = Theme.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final wide = width >= AppBreakpoints.desktop;
    final tint = tintFor(
      ref,
      artworkPath: data.artworkPath,
      seed: data.seed,
      lightness: 0.3,
    );
    final totalLength = data.tracks.fold(
      Duration.zero,
      (sum, t) => sum + t.duration,
    );
    final artSize = wide ? 220.0 : (width * 0.56).clamp(160.0, 240.0);

    void playFrom(int index, {bool shuffle = false}) {
      audio.playTracks(
        data.tracks,
        startIndex: index,
        shuffle: shuffle,
        sourceLabel: data.sourceLabel,
      );
    }

    final header = Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [tint, AppColors.background],
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        MediaQuery.paddingOf(context).top + kToolbarHeight,
        AppSpacing.gutter,
        AppSpacing.lg,
      ),
      child: Flex(
        direction: wide ? Axis.horizontal : Axis.vertical,
        crossAxisAlignment: wide
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.center,
        children: [
          ArtworkImage(
            path: data.artworkPath,
            seed: data.seed,
            size: artSize,
            radius: collection is ArtistRef ? artSize / 2 : AppRadius.md,
            icon: data.icon,
            shadow: true,
          ),
          SizedBox(
            width: wide ? AppSpacing.xl : 0,
            height: wide ? 0 : AppSpacing.xl,
          ),
          _HeaderInfo(
            wide: wide,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  data.kind.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.4,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  data.title,
                  style: (wide
                      ? theme.textTheme.displaySmall
                      : theme.textTheme.headlineMedium),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (data.subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    data.subtitle!,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.xs),
                Text(
                  data.tracks.isEmpty
                      ? 'No songs'
                      : '${formatSongCount(data.tracks.length)} · ${formatTotalLength(totalLength)}',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );

    final actions = Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.sm,
        0,
        AppSpacing.gutter,
        AppSpacing.sm,
      ),
      child: Row(
        children: [
          if (data.playlistId != null)
            _PlaylistMenu(playlistId: data.playlistId!, name: data.title),
          IconButton(
            tooltip: 'Add all to queue',
            onPressed: data.tracks.isEmpty
                ? null
                : () => audio.addToQueue(data.tracks),
            icon: const Icon(
              Icons.queue_music_rounded,
              color: AppColors.textSecondary,
            ),
          ),
          const Spacer(),
          IconButton(
            tooltip: 'Shuffle play',
            iconSize: 30,
            onPressed: data.tracks.isEmpty
                ? null
                : () => playFrom(0, shuffle: true),
            icon: const Icon(
              Icons.shuffle_rounded,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          BigPlayButton(
            isPlaying: isThisPlaying,
            onPressed: data.tracks.isEmpty
                ? null
                : () {
                    if (queue.sourceLabel == data.sourceLabel &&
                        !queue.isEmpty) {
                      audio.togglePlayPause();
                    } else {
                      playFrom(0);
                    }
                  },
          ),
        ],
      ),
    );

    final playlistId = data.playlistId;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: Navigator.of(context).canPop() ? const BackButton() : null,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: header),
          SliverToBoxAdapter(child: actions),
          if (data.tracks.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.xxl),
                child: Text(
                  data.emptyMessage,
                  style: theme.textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ),
            )
          else if (playlistId != null)
            SliverReorderableList(
              itemCount: data.tracks.length,
              onReorderItem: (oldIndex, newIndex) {
                final ids = [for (final t in data.tracks) t.id];
                final moved = ids.removeAt(oldIndex);
                ids.insert(newIndex, moved);
                ref.read(playlistsProvider.notifier).reorder(playlistId, ids);
              },
              itemBuilder: (context, i) => Material(
                key: ValueKey(data.tracks[i].id),
                type: MaterialType.transparency,
                child: TrackTile(
                  track: data.tracks[i],
                  playlistId: playlistId,
                  onTap: () => playFrom(i),
                  trailing: ReorderableDragStartListener(
                    index: i,
                    child: const Padding(
                      padding: EdgeInsets.all(AppSpacing.sm),
                      child: Icon(
                        Icons.drag_handle_rounded,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                ),
              ),
            )
          else
            SliverList.builder(
              itemCount: data.tracks.length,
              itemBuilder: (context, i) => TrackTile(
                track: data.tracks[i],
                leadingNumber: data.numbered
                    ? (data.tracks[i].trackNumber ?? i + 1)
                    : null,
                onTap: () => playFrom(i),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
        ],
      ),
    );
  }
}

class _HeaderInfo extends StatelessWidget {
  const _HeaderInfo({required this.wide, required this.child});

  final bool wide;
  final Widget child;

  @override
  Widget build(BuildContext context) => wide
      ? Expanded(child: child)
      : SizedBox(width: double.infinity, child: child);
}

class _PlaylistMenu extends ConsumerWidget {
  const _PlaylistMenu({required this.playlistId, required this.name});

  final String playlistId;
  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopupMenuButton<String>(
      tooltip: 'Playlist options',
      icon: const Icon(
        Icons.more_horiz_rounded,
        color: AppColors.textSecondary,
      ),
      onSelected: (value) async {
        final notifier = ref.read(playlistsProvider.notifier);
        if (value == 'rename') {
          final newName = await askPlaylistName(
            context,
            title: 'Rename playlist',
            initialName: name,
            confirmLabel: 'Save',
          );
          if (newName != null) await notifier.rename(playlistId, newName);
        } else if (value == 'delete') {
          final confirmed = await confirmAction(
            context,
            title: 'Delete "$name"?',
            message: 'The playlist will be deleted. Your songs stay in your library.',
            confirmLabel: 'Delete',
          );
          if (confirmed) {
            await notifier.delete(playlistId);
            if (context.mounted) Navigator.of(context).maybePop();
          }
        }
      },
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'rename', child: Text('Rename')),
        PopupMenuItem(value: 'delete', child: Text('Delete playlist')),
      ],
    );
  }
}
