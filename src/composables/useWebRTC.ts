import type { DataConnection, Peer as PeerType } from 'peerjs'

export type RTCRole = 'host' | 'guest'
export type ConnectionStatus = 'idle' | 'creating' | 'awaiting-peer' | 'connecting' | 'connected' | 'closed' | 'error'

export interface PeerMessage<T = unknown> {
  type: string
  payload?: T
}

const ROOM_PREFIX = 'game-room-'

/** 生成 6 位大写字母数字房号（去掉易混淆字符） */
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++)
    s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function normalizeRoom(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * 基于 PeerJS 公共信令服务器的房间式 WebRTC 封装。
 * - 主机：createHost() 后获得 6 位房号，等待客机接入
 * - 客机：joinRoom(房号) 直接连接主机
 */
export function useWebRTC() {
  const role = ref<RTCRole | null>(null)
  const status = ref<ConnectionStatus>('idle')
  const roomId = ref('')
  const errorMessage = ref('')
  const lastMessage = ref<PeerMessage | null>(null)

  let peer: PeerType | null = null
  let conn: DataConnection | null = null
  const messageHandlers = new Set<(msg: PeerMessage) => void>()

  function setError(msg: string) {
    errorMessage.value = msg
    status.value = 'error'
  }

  function bindConnection(c: DataConnection) {
    conn = c
    c.on('open', () => { status.value = 'connected' })
    c.on('close', () => { status.value = 'closed' })
    c.on('error', err => setError(err?.message || '连接错误'))
    c.on('data', (data) => {
      try {
        const msg = (typeof data === 'string' ? JSON.parse(data) : data) as PeerMessage
        lastMessage.value = msg
        messageHandlers.forEach(fn => fn(msg))
      }
      catch {
        // 忽略解析失败
      }
    })
  }

  async function ensurePeer(id: string): Promise<PeerType> {
    const { Peer } = await import('peerjs')
    return new Promise((resolve, reject) => {
      const p = new Peer(id, { debug: 1 })
      p.on('open', () => resolve(p))
      p.on('error', err => reject(err))
    })
  }

  /** 主机：创建房间，得到房号后等待客机连入 */
  async function createHost() {
    reset()
    role.value = 'host'
    status.value = 'creating'
    try {
      const id = generateRoomId()
      const p = await ensurePeer(ROOM_PREFIX + id)
      peer = p
      roomId.value = id
      status.value = 'awaiting-peer'
      p.on('connection', (c) => {
        if (conn) {
          c.close()
          return
        }
        status.value = 'connecting'
        bindConnection(c)
      })
      p.on('disconnected', () => {
        if (status.value !== 'connected')
          status.value = 'closed'
      })
      p.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // 房号撞车，自动换一个重试
          reset()
          createHost()
          return
        }
        setError(err.message || '主机异常')
      })
    }
    catch (e) {
      setError((e as Error).message || '创建房间失败')
    }
  }

  /** 客机：通过房号加入房间 */
  async function joinRoom(input: string) {
    const id = normalizeRoom(input)
    if (!id) {
      setError('请输入房号')
      return
    }
    reset()
    role.value = 'guest'
    status.value = 'connecting'
    roomId.value = id
    try {
      const guestId = `${ROOM_PREFIX}guest-${Math.random().toString(36).slice(2, 10)}`
      const p = await ensurePeer(guestId)
      peer = p
      const c = p.connect(ROOM_PREFIX + id, { reliable: true })
      bindConnection(c)
      p.on('error', (err) => {
        if (err.type === 'peer-unavailable')
          setError('房间不存在或已关闭')
        else
          setError(err.message || '连接失败')
      })
    }
    catch (e) {
      setError((e as Error).message || '加入失败')
    }
  }

  function send(message: PeerMessage) {
    if (conn && conn.open)
      conn.send(JSON.stringify(message))
  }

  function onMessage(fn: (msg: PeerMessage) => void) {
    messageHandlers.add(fn)
    return () => messageHandlers.delete(fn)
  }

  function reset() {
    try { conn?.close() }
    catch {}
    try { peer?.destroy() }
    catch {}
    conn = null
    peer = null
    role.value = null
    status.value = 'idle'
    roomId.value = ''
    errorMessage.value = ''
    lastMessage.value = null
  }

  onBeforeUnmount(() => { reset() })

  return {
    role,
    status,
    roomId,
    errorMessage,
    lastMessage,
    createHost,
    joinRoom,
    send,
    onMessage,
    reset,
  }
}
