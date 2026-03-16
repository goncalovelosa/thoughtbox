import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createSessionSummaryVM,
  createSessionDetailVM,
  createThoughtViewModels,
  RawSessionRecord,
  RawThoughtRecord
} from './view-models'

describe('Session View Models (Spec 09)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Session Normalization', () => {
    it('normalizes a basic completed session correctly', () => {
      const raw: RawSessionRecord = {
        id: 'sess_123456789',
        title: ' My Test Session ',
        tags: ['test', 'demo'],
        createdAt: '2026-03-16T10:00:00Z',
        completedAt: '2026-03-16T10:01:30Z',
        status: 'completed',
        thoughts: [{} as any, {} as any] // 2 thoughts
      }

      const summary = createSessionSummaryVM(raw, 'my-workspace')
      expect(summary.id).toBe('sess_123456789')
      expect(summary.shortId).toBe('sess_12')
      expect(summary.title).toBe('My Test Session')
      expect(summary.thoughtCount).toBe(2)
      expect(summary.href).toBe('/w/my-workspace/runs/sess_123456789')
      expect(summary.durationLabel).toBe('90.0s')

      const detail = createSessionDetailVM(raw)
      expect(detail.id).toBe('sess_123456789')
      expect(detail.tags).toEqual(['test', 'demo'])
      expect(detail.durationLabel).toBe('90.0s')
      expect(detail.isLiveCapable).toBe(false)
    })

    it('falls back gracefully when optional fields are missing', () => {
      const raw: RawSessionRecord = {
        id: 'sess_999',
        createdAt: '2026-03-16T10:00:00Z',
        status: 'abandoned'
      }

      const summary = createSessionSummaryVM(raw, 'ws')
      expect(summary.title).toBeUndefined()
      expect(summary.thoughtCount).toBeUndefined()
      expect(summary.durationLabel).toBe('—')

      const detail = createSessionDetailVM(raw)
      expect(detail.title).toBeUndefined()
      expect(detail.tags).toEqual([])
      expect(detail.thoughtCount).toBe(0)
    })
    
    it('calculates duration correctly for active vs completed sessions', () => {
      const active: RawSessionRecord = {
        id: 'sess_1',
        createdAt: '2026-03-16T11:59:00Z', // 1 min ago relative to mock time
        status: 'active'
      }

      const detail = createSessionDetailVM(active)
      expect(detail.durationLabel).toBe('60.0s')
      expect(detail.isLiveCapable).toBe(true)
    })
  })

  describe('Thought Normalization', () => {
    it('handles untyped historical thoughts as reasoning', () => {
      const raw: RawThoughtRecord = {
        id: 'th_1',
        thought: 'This is a test thought',
        timestamp: '2026-03-16T10:00:00Z'
      }

      const { rows, details } = createThoughtViewModels([raw])
      expect(rows[0].displayType).toBe('reasoning')
      expect(rows[0].isTyped).toBe(false)
      expect(details['th_1']?.rawThought).toBe('This is a test thought')
    })

    it('preserves typed metadata when thoughtType is present', () => {
      const raw: RawThoughtRecord = {
        id: 'th_1',
        thought: 'I will write a file',
        timestamp: '2026-03-16T10:00:00Z',
        thoughtType: 'action_report',
        actionResult: {
          success: true,
          reversible: 'yes',
          tool: 'write_file',
          target: 'test.ts'
        }
      }

      const { rows, details } = createThoughtViewModels([raw])
      expect(rows[0].displayType).toBe('action_report')
      expect(rows[0].isTyped).toBe(true)
      
      const detail = details['th_1']!
      expect(detail.actionResult?.tool).toBe('write_file')
    })

    it('generates a comprehensive searchIndexText string', () => {
      const raw: RawThoughtRecord = {
        id: 'th_1',
        thought: 'Testing search',
        timestamp: '2026-03-16T10:00:00Z',
        thoughtType: 'decision_frame',
        options: [
          { label: 'Option A', selected: true, reason: 'Because A' }
        ]
      }

      const { rows } = createThoughtViewModels([raw])
      const searchStr = rows[0].searchIndexText
      expect(searchStr).toContain('testing search')
      expect(searchStr).toContain('decision_frame')
      expect(searchStr).toContain('option a')
      expect(searchStr).toContain('because a')
    })

    it('identifies timestamp gaps > 5 minutes', () => {
      const thoughts: RawThoughtRecord[] = [
        { id: 't1', thought: 'A', timestamp: '2026-03-16T10:00:00Z', thoughtNumber: 1 },
        { id: 't2', thought: 'B', timestamp: '2026-03-16T10:01:00Z', thoughtNumber: 2 }, // 1m gap
        { id: 't3', thought: 'C', timestamp: '2026-03-16T10:07:00Z', thoughtNumber: 3 }, // 6m gap
        { id: 't4', thought: 'D', timestamp: '2026-03-16T11:15:00Z', thoughtNumber: 4 }, // 1h 8m gap
      ]

      const { rows } = createThoughtViewModels(thoughts)
      
      expect(rows[0].showGapBefore).toBe(false)
      
      expect(rows[1].showGapBefore).toBe(false)
      
      expect(rows[2].showGapBefore).toBe(true)
      expect(rows[2].gapLabel).toBe('6m gap')
      
      expect(rows[3].showGapBefore).toBe(true)
      expect(rows[3].gapLabel).toBe('1h 8m gap')
    })
  })

  describe('Lane Assignment', () => {
    it('assigns the main chain to lane 0', () => {
      const raw: RawThoughtRecord = {
        id: 't1', thought: 'A', timestamp: '2026-03-16T10:00:00Z'
      }
      const { rows } = createThoughtViewModels([raw])
      expect(rows[0].laneIndex).toBe(0)
      expect(rows[0].laneColorToken).toBe('sessionLane-main')
    })

    it('assigns branches to subsequent lanes deterministically', () => {
      const thoughts: RawThoughtRecord[] = [
        { id: 't1', thought: 'A', timestamp: '2026-03-16T10:00:00Z' },
        { id: 't2', thought: 'B', timestamp: '2026-03-16T10:01:00Z', branchId: 'branch_a' },
        { id: 't3', thought: 'C', timestamp: '2026-03-16T10:02:00Z', branchId: 'branch_b' },
        { id: 't4', thought: 'D', timestamp: '2026-03-16T10:03:00Z', branchId: 'branch_a' },
      ]
      
      const { rows } = createThoughtViewModels(thoughts)
      expect(rows[0].laneIndex).toBe(0) // main
      expect(rows[1].laneIndex).toBe(1) // branch A
      expect(rows[2].laneIndex).toBe(2) // branch B
      expect(rows[3].laneIndex).toBe(1) // branch A continues
    })
    
    it('assigns proper lane color tokens based on lane index', () => {
      const thoughts: RawThoughtRecord[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `t${i}`,
        thought: `t${i}`,
        timestamp: `2026-03-16T10:0${i}:00Z`,
        branchId: i === 0 ? undefined : `branch_${i}`
      }))

      const { rows } = createThoughtViewModels(thoughts)
      expect(rows[0].laneColorToken).toBe('sessionLane-main')
      expect(rows[1].laneColorToken).toBe('sessionLane-branch1')
      expect(rows[5].laneColorToken).toBe('sessionLane-branch5')
      expect(rows[6].laneColorToken).toBe('sessionLane-main') // wraps around
    })
  })
  
  describe('Error Tolerance', () => {
    it('does not throw when malformed typed metadata is encountered', () => {
      const raw: RawThoughtRecord = {
        id: 't1', thought: 'A', timestamp: '2026-03-16T10:00:00Z',
        // @ts-expect-error - intentionally forcing malformed data that might sneak past API boundary
        thoughtType: 'invalid_type',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: null as any
      }
      
      expect(() => createThoughtViewModels([raw])).not.toThrow()
      const { rows, details } = createThoughtViewModels([raw])
      expect(rows[0].displayType).toBe('invalid_type')
      expect(details['t1']?.options).toBeNull() // null handled gracefully by runtime
    })
    
    it('places extra persistence fields into debugMeta', () => {
      const raw: RawThoughtRecord = {
        id: 't1', thought: 'A', timestamp: '2026-03-16T10:00:00Z',
        agentName: 'TestAgent',
        contentHash: '0x123abc'
      }

      const { details } = createThoughtViewModels([raw])
      const meta = details['t1']!.debugMeta
      
      expect(meta.agentName).toBe('TestAgent')
      expect(meta.contentHash).toBe('0x123abc')
      expect(meta.id).toBeUndefined() // Should not duplicate known fields
    })
  })
})
