import { rtdb } from '../firebase'
import { ref as rRef, onValue, set, onDisconnect, remove, get } from 'firebase/database'

export const trackPresence = (roomId, userId, userName) => {
    const userStatusRef = rRef(rtdb, `rooms/${roomId}/online_users/${userId}`)

    const status = {
        name: userName,
        online: true,
        lastChanged: new Date().getTime()
    }

    // Set user as online
    set(userStatusRef, status)

    // On disconnect (crash/hard close), remove the user from online users
    onDisconnect(userStatusRef).remove()
}

export const leaveRoom = async (roomId, userId) => {
    const userStatusRef = rRef(rtdb, `rooms/${roomId}/online_users/${userId}`)
    const roomOnlineRef = rRef(rtdb, `rooms/${roomId}/online_users`)
    const roomRef = rRef(rtdb, `rooms/${roomId}`)

    try {
        // 1. Remove myself
        await remove(userStatusRef)

        // 2. Check if others are left
        const snapshot = await get(roomOnlineRef)
        if (!snapshot.exists()) {
            // Last one out, turn off the lights
            await remove(roomRef)
            console.log(`Room ${roomId} deleted as the last participant left.`)
        }
    } catch (err) {
        console.error("Error during leaveRoom:", err)
    }
}


