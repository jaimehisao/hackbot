const guildModel = require('../models/guild')
const createTicket = require('../functions/createTicket')
const addMentor = require('../functions/addMentor')
const ticketModel = require('../models/ticket')
const mentorModel = require('../models/mentor')


module.exports = async(client, reaction, user) => {
    if(reaction.message.partial) await reaction.message.fetch()
    if(reaction.partial) await reaction.fetch()
    if(user.bot) return

    const guild = reaction.message.guild

    var guildDoc = await guildModel.findOne({ guildID: guild.id })

    if(!guildDoc) {
        guildDoc = new guildModel({
            guildID: guild.id,
            ticketCount: 0
        })

        await guildDoc.save()
    }


    if(reaction.message.channel.id === '840626647362699284') { // ID del canal ticket en el que se reaccionara.
        
        if(reaction.emoji.name === '🎫') {
            const ticketDoc = await ticketModel.findOne({ guildID: guild.id, userID: user.id })

            if(ticketDoc) {
                const channel = guild.channels.cache.get(ticketDoc.channelID)

                if(channel) {
                    user.send('Actualmente tienes un ticket abierto!')
                } else {
                    await ticketDoc.deleteOne()

                    createTicket(guild, user, guildDoc, ticketModel)
                }
            } else {
                createTicket(guild, user, guildDoc, ticketModel)
            }
        }

    } else if (reaction.message.channel.id === '849143330377302046') { // id del canal de administracion de mentoreo
        if(reaction.emoji.name === '✒️') {
            const mentorDoc = await mentorModel.findOne({ userID: user.id})

            if(mentorDoc){
                user.send('Este mentor ya existe.')
            } else {
                addMentor(reaction.message, guild, user, mentorModel)
            }
        }
    } else if (reaction.message.channel.id === '810379900418129950') { // id del canal de administracion de mentoreo
        if(reaction.emoji.name === '🎫') {

        }
    }

}