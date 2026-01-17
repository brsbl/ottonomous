/**
 * .als file parser for Ableton Live projects
 *
 * Ableton .als files are gzipped XML. This module handles:
 * 1. Decompressing the gzip data with pako
 * 2. Parsing the XML
 * 3. Extracting metadata (BPM, track counts, plugins, version)
 */

import pako from 'pako';

/**
 * Metadata extracted from an Ableton .als file
 */
export interface AlsMetadata {
  /** Project tempo in BPM */
  bpm: number | null;
  /** Total number of tracks */
  trackCount: number;
  /** Number of audio tracks */
  audioTrackCount: number;
  /** Number of MIDI tracks */
  midiTrackCount: number;
  /** Number of return tracks */
  returnTrackCount: number;
  /** VST/AU plugin names used in the project */
  plugins: string[];
  /** Native Ableton devices used in the project */
  abletonDevices: string[];
  /** Ableton Live version that created the project */
  abletonVersion: string | null;
  /** Any errors encountered during parsing (partial data may still be available) */
  parseErrors: string[];
}

/**
 * Parses an Ableton Live project file (.als) and extracts metadata
 *
 * @param arrayBuffer - The raw file contents as an ArrayBuffer
 * @returns Extracted metadata (may be partial if errors occur)
 */
export function parseAlsFile(arrayBuffer: ArrayBuffer): AlsMetadata {
  const result: AlsMetadata = {
    bpm: null,
    trackCount: 0,
    audioTrackCount: 0,
    midiTrackCount: 0,
    returnTrackCount: 0,
    plugins: [],
    abletonDevices: [],
    abletonVersion: null,
    parseErrors: [],
  };

  // Step 1: Decompress gzip data
  let xmlString: string;
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const decompressed = pako.inflate(uint8Array);
    const decoder = new TextDecoder('utf-8');
    xmlString = decoder.decode(decompressed);
  } catch (error) {
    result.parseErrors.push(
      `Failed to decompress .als file: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }

  // Step 2: Parse XML
  let xmlDoc: Document;
  try {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      result.parseErrors.push(`XML parsing error: ${parserError.textContent}`);
      return result;
    }
  } catch (error) {
    result.parseErrors.push(
      `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`
    );
    return result;
  }

  // Step 3: Extract metadata - each extraction is independent and can fail gracefully

  // Extract Ableton version from Creator attribute on root Ableton element
  try {
    const abletonElement = xmlDoc.querySelector('Ableton');
    if (abletonElement) {
      const creator = abletonElement.getAttribute('Creator');
      if (creator) {
        result.abletonVersion = creator;
      }
    }
  } catch (error) {
    result.parseErrors.push(
      `Failed to extract Ableton version: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract BPM from Tempo element
  try {
    // The tempo is typically stored as: <Tempo><Manual Value="120" /></Tempo>
    // or in newer versions: <Tempo><ArrangerAutomation><Events><FloatEvent Value="120" /></Events></ArrangerAutomation></Tempo>
    const tempoElement = xmlDoc.querySelector('Tempo Manual');
    if (tempoElement) {
      const bpmValue = tempoElement.getAttribute('Value');
      if (bpmValue) {
        const bpm = parseFloat(bpmValue);
        if (!isNaN(bpm) && bpm > 0) {
          result.bpm = bpm;
        }
      }
    }

    // Try alternative location if not found
    if (result.bpm === null) {
      const floatEvent = xmlDoc.querySelector('Tempo FloatEvent');
      if (floatEvent) {
        const bpmValue = floatEvent.getAttribute('Value');
        if (bpmValue) {
          const bpm = parseFloat(bpmValue);
          if (!isNaN(bpm) && bpm > 0) {
            result.bpm = bpm;
          }
        }
      }
    }
  } catch (error) {
    result.parseErrors.push(
      `Failed to extract BPM: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract track counts by type
  try {
    // Audio tracks
    const audioTracks = xmlDoc.querySelectorAll('Tracks AudioTrack');
    result.audioTrackCount = audioTracks.length;

    // MIDI tracks
    const midiTracks = xmlDoc.querySelectorAll('Tracks MidiTrack');
    result.midiTrackCount = midiTracks.length;

    // Return tracks
    const returnTracks = xmlDoc.querySelectorAll('Tracks ReturnTrack');
    result.returnTrackCount = returnTracks.length;

    // Total track count
    result.trackCount = result.audioTrackCount + result.midiTrackCount + result.returnTrackCount;
  } catch (error) {
    result.parseErrors.push(
      `Failed to extract track counts: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract plugin names from PluginDevice elements
  try {
    const pluginDevices = xmlDoc.querySelectorAll('PluginDevice');
    const pluginNames = new Set<string>();

    pluginDevices.forEach((device) => {
      // Try to get plugin name from PluginDesc > VstPluginInfo > PluginName
      const vstPluginName = device.querySelector('PluginDesc VstPluginInfo PluginName');
      if (vstPluginName) {
        const value = vstPluginName.getAttribute('Value');
        if (value && value.trim()) {
          pluginNames.add(value.trim());
        }
      }

      // Also check for AU plugins: PluginDesc > AuPluginInfo > Name
      const auPluginName = device.querySelector('PluginDesc AuPluginInfo Name');
      if (auPluginName) {
        const value = auPluginName.getAttribute('Value');
        if (value && value.trim()) {
          pluginNames.add(value.trim());
        }
      }

      // Check for Vst3PluginInfo as well
      const vst3PluginName = device.querySelector('PluginDesc Vst3PluginInfo Name');
      if (vst3PluginName) {
        const value = vst3PluginName.getAttribute('Value');
        if (value && value.trim()) {
          pluginNames.add(value.trim());
        }
      }
    });

    result.plugins = Array.from(pluginNames).sort();
  } catch (error) {
    result.parseErrors.push(
      `Failed to extract plugins: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract native Ableton devices
  try {
    const abletonDeviceNames = new Set<string>();

    // Common Ableton device types to look for
    const deviceTypes = [
      'Compressor2',
      'Eq8',
      'Reverb',
      'Delay',
      'AutoFilter',
      'Chorus',
      'Flanger',
      'Phaser',
      'Gate',
      'GlueCompressor',
      'Limiter',
      'MultibandDynamics',
      'Saturator',
      'Overdrive',
      'Redux',
      'Erosion',
      'FrequencyShifter',
      'Resonators',
      'Vocoder',
      'OriginalSimpler',
      'MultiSampler',
      'Operator',
      'Collision',
      'StringStudio',
      'InstrumentVector',
      'Drift',
      'DrumGroupDevice',
      'InstrumentGroupDevice',
      'AudioEffectGroupDevice',
      'MidiEffectGroupDevice',
    ];

    deviceTypes.forEach((deviceType) => {
      const devices = xmlDoc.querySelectorAll(deviceType);
      if (devices.length > 0) {
        abletonDeviceNames.add(deviceType);
      }
    });

    result.abletonDevices = Array.from(abletonDeviceNames).sort();
  } catch (error) {
    result.parseErrors.push(
      `Failed to extract Ableton devices: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Checks if an ArrayBuffer contains a valid gzipped .als file
 *
 * @param arrayBuffer - The raw file contents
 * @returns true if the file appears to be a valid gzipped file
 */
export function isValidAlsFile(arrayBuffer: ArrayBuffer): boolean {
  if (arrayBuffer.byteLength < 2) {
    return false;
  }

  const header = new Uint8Array(arrayBuffer.slice(0, 2));
  // Gzip magic number: 0x1f 0x8b
  return header[0] === 0x1f && header[1] === 0x8b;
}
