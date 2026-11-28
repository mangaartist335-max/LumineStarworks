import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/library/collection_screen.dart';
import 'package:moneybeats/features/player/mini_player.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/features/player/player_controls.dart';
import 'package:moneybeats/features/player/queue_view.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/track_actions_sheet.dart';

/// Slides Now Playing up from the bottom, over the whole app.
class NowPlayingRoute extends PageRouteBuilder<void> {
  NowPlayingRoute()
    : super(
        opaque: true,
        fullscreenDialog: true,
        transitionDuration: const Duration(milliseconds: 380),
        reverseTransitionDuration: const Duration(milliseconds: 300),
        pageBuilder: (context, animation, secondaryAnimation) =>
            const NowPlayingScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
            reverseCurve: Curves.easeInCubic,
          );
          return SlideTransition(
            position: Tween(
              begin: const Offset(0, 1),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          );
        },
      );
}

class NowPlayingScreen extends ConsumerStatefulWidget {
  const NowPlayingScreen({super.key});

  @override
  ConsumerState<NowPlayingScreen> createState() => _NowPlayingScreenState();
}

class _NowPlayingScreenState extends ConsumerState<NowPlayingScreen> {
  double _dragOffset = 0;

  void _close() => Navigator.of(context).maybePop();

  @override
  Widget build(BuildContext context) {
    final track = ref.watch(currentTrackProvider);
    // Close automatically if the queue is cleared.
    if (track == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _close();
      });
      return const Scaffold();
    }

    final size = MediaQuery.sizeOf(context);
    final wide = size.width >= AppBreakpoints.desktop;
    final tint = tintFor(
      ref,
      artworkPath: track.artworkPath,
      seed: track.displayAlbum,
      lightness: 0.3,
    );

    final body = AnimatedContainer(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            tint,
            Color.lerp(tint, AppColors.background, 0.75)!,
            AppColors.background,
          ],
          stops: const [0, 0.55, 1],
        ),
      ),
      child: SafeArea(
        child: wide
            ? _WideLayout(track: track, onClose: _close)
            : _PhoneLayout(track: track, onClose: _close),
      ),
    );

    if (wide) return Scaffold(body: body);

    // Drag down anywhere outside the sliders to dismiss.
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: GestureDetector(
        onVerticalDragUpdate: (details) {
          setState(
            () => _dragOffset = (_dragOffset + details.delta.dy).clamp(
              0,
              size.height,
            ),
          );
        },
        onVerticalDragEnd: (details) {
          final velocity = details.primaryVelocity ?? 0;
          if (_dragOffset > size.height * 0.18 || velocity > 900) {
            _close();
          } else {
            setState(() => _dragOffset = 0);
          }
        },
        child: AnimatedContainer(
          duration: Duration(milliseconds: _dragOffset == 0 ? 220 : 0),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, _dragOffset, 0),
          child: body,
        ),
      ),
    );
  }
}

class _TopBar extends ConsumerWidget {
  const _TopBar({required this.track, required this.onClose});

  final Track track;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final source = ref.watch(queueStateProvider.select((q) => q.sourceLabel));
    final theme = Theme.of(context);
    final parts = source?.split(' · ');
    final kind = parts != null && parts.length > 1 ? parts.first : null;
    final name = parts != null && parts.length > 1
        ? parts.sublist(1).join(' · ')
        : source;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Close',
            onPressed: onClose,
            icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  kind == null
                      ? 'NOW PLAYING'
                      : 'PLAYING FROM ${kind.toUpperCase()}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name ?? 'Your library',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Audio Studio',
            onPressed: () => AppNav.openStudio(context, ref),
            icon: const Icon(Icons.tune_rounded),
          ),
          IconButton(
            tooltip: 'More options',
            onPressed: () => showTrackActions(context, ref, track),
            icon: const Icon(Icons.more_vert_rounded),
          ),
        ],
      ),
    );
  }
}

class _Artwork extends ConsumerWidget {
  const _Artwork({required this.track, required this.maxSize});

  final Track track;
  final double maxSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audio = ref.read(audioPlayerServiceProvider);
    final isPlaying = ref.watch(
      playbackStatusProvider.select((s) => s.showPause),
    );
    return GestureDetector(
      onHorizontalDragEnd: (details) {
        final velocity = details.primaryVelocity ?? 0;
        if (velocity < -300) audio.skipToNext();
        if (velocity > 300) audio.skipToPrevious();
      },
      child: AnimatedScale(
        // Artwork relaxes slightly when paused.
        scale: isPlaying ? 1.0 : 0.9,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutBack,
        child: Hero(
          tag: nowPlayingArtworkHeroTag,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween(begin: 0.94, end: 1.0).animate(animation),
                child: child,
              ),
            ),
            child: ArtworkImage(
              key: ValueKey(track.id),
              path: track.artworkPath,
              seed: track.displayAlbum,
              size: maxSize,
              radius: AppRadius.md,
              shadow: true,
            ),
          ),
        ),
      ),
    );
  }
}

class _TitleRow extends ConsumerWidget {
  const _TitleRow({required this.track});

  final Track track;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.centerLeft,
              children: [...previous, ?current],
            ),
            child: Column(
              key: ValueKey(track.id),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  track.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.headlineSmall?.copyWith(fontSize: 24),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: () => AppNav.openCollection(
                    context,
                    ref,
                    CollectionRef.artist(track.displayArtist),
                  ),
                  child: Text(
                    track.displayArtist,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        FavoriteButton(track: track, size: 28),
      ],
    );
  }
}

class _Transport extends StatelessWidget {
  const _Transport();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        ShuffleButton(size: 26),
        SkipPreviousButton(size: 42),
        PlayPauseButton(size: 72),
        SkipNextButton(size: 42),
        RepeatButton(size: 26),
      ],
    );
  }
}

void _showQueueSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      builder: (context, controller) => QueueView(scrollController: controller),
    ),
  );
}

class _PhoneLayout extends StatelessWidget {
  const _PhoneLayout({required this.track, required this.onClose});

  final Track track;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _TopBar(track: track, onClose: onClose),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final side = (constraints.maxWidth - AppSpacing.xl * 2).clamp(
                120.0,
                constraints.maxHeight - 16,
              );
              return Center(
                child: _Artwork(track: track, maxSize: side),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: _TitleRow(track: track),
        ),
        const SizedBox(height: AppSpacing.md),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: SeekBar(),
        ),
        const SizedBox(height: AppSpacing.sm),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: _Transport(),
        ),
        const SizedBox(height: AppSpacing.sm),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            0,
            AppSpacing.md,
            AppSpacing.md,
          ),
          child: Row(
            children: [
              const Expanded(child: VolumeSlider()),
              IconButton(
                tooltip: 'Queue',
                onPressed: () => _showQueueSheet(context),
                icon: const Icon(Icons.queue_music_rounded),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _WideLayout extends StatelessWidget {
  const _WideLayout({required this.track, required this.onClose});

  final Track track;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            children: [
              _TopBar(track: track, onClose: onClose),
              Expanded(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 560),
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      child: Column(
                        children: [
                          Expanded(
                            child: LayoutBuilder(
                              builder: (context, constraints) => Center(
                                child: _Artwork(
                                  track: track,
                                  maxSize: constraints.biggest.shortestSide
                                      .clamp(120.0, 520.0),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          _TitleRow(track: track),
                          const SizedBox(height: AppSpacing.md),
                          const SeekBar(),
                          const SizedBox(height: AppSpacing.sm),
                          const _Transport(),
                          const SizedBox(height: AppSpacing.sm),
                          const SizedBox(width: 320, child: VolumeSlider()),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 380,
          decoration: BoxDecoration(
            color: AppColors.background.withValues(alpha: 0.55),
            border: const Border(left: BorderSide(color: AppColors.outline)),
          ),
          child: const QueueView(padding: EdgeInsets.only(top: AppSpacing.sm)),
        ),
      ],
    );
  }
}
