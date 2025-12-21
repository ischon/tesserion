import { rtdb, db } from '../firebase'
import { ref as rRef, onValue, set, onDisconnect, remove } from 'firebase/database'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'

export const trackPresence = (roomId, userId, userName) => {
    const userStatusRef = rRef(rtdb, `rooms/${roomId}/users/${userId}`)
    const roomStatusRef = rRef(rtdb, `rooms/${roomId}/users`)

    const status = {
        name: userName,
        online: true,
        lastChanged: new Date().getTime()
    }

    // Set user as online
    set(userStatusRef, status)

    // On disconnect, remove the user from the room status
    onDisconnect(userStatusRef).remove()

    // Listen to the room status to handle automatic cleanup
    onValue(roomStatusRef, async (snapshot) => {
        const users = snapshot.val()
        if (!users) {
            // No users left in RTDB, delete the room from Firestore
            // Note: This needs to be carefully handled to avoid premature deletion 
            // when a user refreshes. We'll add a small delay or check.
            try {
                const roomDoc = await getDoc(doc(db, 'rooms', roomId))
                if (roomDoc.exists()) {
                    // If no users are tracked in RTDB for more than 5 seconds, delete
                    setTimeout(async () => {
                        const currentSnapshot = await new Promise(resolve => onValue(roomStatusRef, resolve, { onlyOnce: true }))
                        if (!currentSnapshot.val()) {
                            await deleteDoc(doc(db, 'rooms', roomId))
                            console.log(`Room ${roomId} deleted as it was empty.`)
                        }
                    }, 5000)
                }
            } catch (err) {
                console.error("Cleanup error:", err)
            }
        }
    })
}
