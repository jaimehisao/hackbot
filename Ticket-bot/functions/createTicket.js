const Discord = require('discord.js');
const fetchall = require('discord-fetch-all')
const fs = require('fs')
const { MessageAttachment, Message } = require('discord.js')

module.exports = async (guild, user, guildDoc, ticketModel) => {
    guildDoc.ticketCount += 1;

    await guildDoc.save()

    let create_ticket = new Discord.MessageEmbed()
        .setTitle('¡Bienvenido al soporte de HackMTY!')
        .setDescription('Alguien te atenderá a la brevedad. \n 🔒 Cerrar ticket')
        .setFooter('HackMTY 2021')
        .setColor('#10D800')

    let close_ticket = new Discord.MessageEmbed()
        .setTitle('¿Estas seguro?')
        .setDescription('🔒 Cerrar ticket \n ❎ Cancelar \n ✅ Confirmar')
        .setFooter('HackMTY 2021')
        .setColor('#10D800')
    
    let save_ticket = new Discord.MessageEmbed()
        .setTitle('Procesando...')
        .setDescription('📄 Guardar Conversacion \n 🔓 Reabrir ticket \n ⛔ Borrar Ticket')
        .setFooter('HackMTY 2021')
        .setColor('#F60000')

    const ticketChannel = await guild.channels.create(`ticket-${user.username.toLowerCase() + user.discriminator}`, {
        type: 'text',
        parent: '811503336766832650',
        permissionOverwrites: [
            {
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                id: user.id
            },
            {
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                id: guild.id
            }
        ]
    })

    const reactionMessage = await ticketChannel.send(create_ticket)
    reactionMessage.react("🔒");

    const ticketCollector = reactionMessage.createReactionCollector((reaction, user) =>
        reaction.message.guild.members.cache.find((member) => member.id === user.id).hasPermission('ADMINISTRATOR') && !user.bot,
        { dispose: true }
    )

    const ticketDoc = await ticketModel.findOne({ guildID: guild.id, userID: user.id })
        
    ticketCollector.on('collect', async (reaction) => {

        if(reaction.emoji.name === '⛔') {
            reaction.message.channel.delete()

            await ticketDoc.deleteOne()
            user.send('El ticket ha sido borrado.').catch(err => console.log(err))
        } else if (reaction.emoji.name === '🔒') {
            await reaction.message.channel.updateOverwrite(user.id, { SEND_MESSAGES: false});
            reactionMessage.edit(close_ticket)
            .then(message => {
                message.react("❎");
                message.react("✅");
            })
            
        } else if (reaction.emoji.name === '❎') {
            await reaction.message.channel.updateOverwrite(user.id, { SEND_MESSAGES: true});
            reactionMessage.edit(create_ticket)
            .then(message => {
                reactionMessage.reactions.removeAll()
                message.react("🔒");
            })

        } else if (reaction.emoji.name === '✅') {
            let close_ticket_by = new Discord.MessageEmbed()
                .setDescription(`El Ticket a sido cerrado.`)
                .setColor('#F6F600')
            await reaction.message.channel.send(close_ticket_by);
            reactionMessage.edit(save_ticket)
            .then(message => {
                reactionMessage.reactions.removeAll()
                message.react("📄");
                message.react("🔓");
                message.react("⛔");
            })

        } else if (reaction.emoji.name === '🔓') {
            let open_ticket_by = new Discord.MessageEmbed()
                .setDescription(`El Ticket ha sido reabierto.`)
                .setColor('#10D800')
            await reaction.message.channel.send(open_ticket_by);
            await reaction.message.channel.updateOverwrite(user.id, { SEND_MESSAGES: true});
            reactionMessage.edit(create_ticket)
            .then(message => {
                reactionMessage.reactions.removeAll()
                message.react("🔒");
            })

        } else if (reaction.emoji.name === '📄') {
            const msgs = await fetchall.messages(reaction.message.channel, {
                reverseArray: true
            })

            const content = msgs.map(m => `${m.author.tag} - ${m.content}`)

            fs.writeFileSync('transcript.txt', content.join('\n'), error => {
                if(error) throw error
            })

            reaction.message.channel.send(new MessageAttachment('transcript.txt', 'transcript.txt'))

        }

        const tickDoc = new ticketModel({
            guildID: guild.id,
            userID: user.id,
            channelID: ticketChannel.id,
        })

        await tickDoc.save()
    })
}