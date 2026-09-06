/* Photo coordinates refer to the original, uncropped 4:3 images.
   Keep this editorial content descriptive: this is a tour, not a diagnostic tool. */
export const scenes = [
  {
    id: 'macbook', name: 'MacBook', label: '01 / A laptop, opened up',
    image: '/assets/hero/repair-bench-macbook.webp', width: 1600, height: 1200,
    alt: 'Open MacBook on an orange repair mat, showing its battery cells, cooling fan, logic board, and right speaker.',
    link: '/macbook-repair', linkText: 'Explore MacBook repair',
    parts: [
      { id: 'battery', name: 'Battery', x: 44, y: 77, tag: 'Stored energy',
        title: 'A lot of the inside is battery.',
        body: 'Those large black sections across the lower half are battery cells. Spreading them across the case makes room for more capacity without making the laptop much thicker.',
        detail: 'The battery is a separate assembly from the logic board. Reaching it and handling its adhesive carefully are part of the replacement work.',
        fact: 'Several cells. One battery assembly.' },
      { id: 'fan', name: 'Cooling fan', x: 55, y: 29, tag: 'Moving heat',
        title: 'Small fan. Important job.',
        body: 'The circular blades move air through the cooling system. The fan works with the heat sink to carry heat away from the electronics and out of the case.',
        detail: 'Cooling is a system: the fan, air path, and contact between the hot components and their cooling hardware all have a role.',
        fact: 'Airflow is only one part of cooling.' },
      { id: 'board', name: 'Logic board', x: 22, y: 60, tag: 'Connected systems',
        title: 'The connections behind everything.',
        body: 'The logic board connects the computer’s processors, power circuits, and other electronics. The tiny components you can see are only part of that network; copper connections also run inside the board.',
        detail: 'A board repair works at the level of components and electrical connections. Replacing an entire board is a different kind of job.',
        fact: 'A circuit board has more than one layer.' },
      { id: 'speaker', name: 'Speaker', x: 90, y: 69, tag: 'Sound, in a small space',
        title: 'Even the empty space has a job.',
        body: 'The speaker sits along the edge beside the battery. Its shaped enclosure gives sound room to move inside a very thin computer.',
        detail: 'The enclosure, its mounting points, and the connection to the board all belong to the speaker assembly. Repair involves more than the visible speaker surface.',
        fact: 'The enclosure is part of the sound.' }
    ]
  },
  {
    id: 'ps5', name: 'PlayStation 5', label: '02 / A console, down to the board',
    image: '/assets/services/ps5-mainboard.webp', width: 1400, height: 1050,
    alt: 'PlayStation 5 motherboard on a repair mat, with the processor at left, rear ports across the top, and fine circuit traces across the board.',
    link: '/ps5-repair', linkText: 'Explore PS5 repair',
    parts: [
      { id: 'processor', name: 'Processor', x: 14, y: 30, tag: 'At the center of play',
        title: 'Where the game comes together.',
        body: 'The large chip at the left combines the console’s main processing and graphics work. In this opened view, the cooling assembly has been removed and the thermal interface is visible.',
        detail: 'The PS5 uses liquid metal to transfer heat from its processor into the cooling assembly. The surrounding barrier helps contain it.',
        fact: 'Processing and graphics share one main chip.' },
      { id: 'hdmi', name: 'HDMI port', x: 86, y: 20, tag: 'The picture’s way out',
        title: 'One small port. Many connections.',
        body: 'The HDMI port is the metal socket at the far right of the rear connector row. It carries digital picture and sound from the console to a display.',
        detail: 'This port is soldered to the motherboard. Replacing it means working on its small signal connections as well as the larger joints that hold it in place.',
        fact: 'A soldered connector, not a plug-in module.' },
      { id: 'traces', name: 'Circuit traces', x: 37, y: 48, tag: 'The hidden network',
        title: 'A city of tiny connections.',
        body: 'Look at the fine lines fanning across the green board. These are circuit traces: copper paths carrying signals between components.',
        detail: 'The visible paths are only part of a multilayer board. A connection can need attention even when the surrounding parts look intact.',
        fact: 'The green surface covers a copper network.' },
      { id: 'usb', name: 'USB ports', x: 40, y: 14, tag: 'Everyday connections',
        title: 'Built for more than a cable.',
        body: 'The two matching metal sockets at the left of the rear connector row are USB ports. They connect accessories and compatible external storage to the console.',
        detail: 'A connector needs both an electrical connection and a solid physical attachment. The socket’s metal shell helps support repeated plugging and unplugging.',
        fact: 'Mechanical strength matters, too.' }
    ]
  }
];

export function selectionFromHash(hash) {
  const value = hash.replace(/^#/, '');
  for (const scene of scenes) {
    const part = scene.parts.find(part => `${scene.id}-${part.id}` === value);
    if (part) return { scene, part };
  }
  return { scene: scenes[0], part: scenes[0].parts[0] };
}

// A selected point is centered where possible, with no blank image edges.
export function cameraFor(part, zoom) {
  const clamp = value => Math.max(100 * (1 - zoom), Math.min(0, value));
  return { x: clamp(50 - part.x * zoom), y: clamp(50 - part.y * zoom), zoom };
}
