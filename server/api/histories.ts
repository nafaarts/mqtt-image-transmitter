import Datastore from "nedb"

const db = new Datastore({
    filename: "./db/histories.db",
    autoload: true,
})

db.loadDatabase()

export default defineEventHandler(async (event) => {
    assertMethod(event, ['GET', 'POST', 'DELETE'])
    if (event.method === 'GET') {
        const histories = await new Promise((resolve, reject) => {
            db.find({}).sort({ created_at: -1 }).limit(10).exec((err, docs) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(docs)
                }
            })
        })
        return histories
    } else if (event.method === 'POST') {
        const { host, topic, message, created_at } = await readBody(event)
        const newHistory = await new Promise((resolve, reject) => {
            db.insert({
                host,
                topic,
                message,
                created_at: new Date(created_at)
            }, (err, doc) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(doc)
                }
            })
        })
        return newHistory
    } else if (event.method === 'DELETE') {
        const { _id } = await readBody(event)
        const deletedHistory = await new Promise((resolve, reject) => {
            db.remove({ _id }, {}, (err, numRemoved) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(numRemoved)
                }
            })
        })
        return deletedHistory
    }

})