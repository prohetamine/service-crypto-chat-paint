/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract, Wallet, JsonRpcProvider } from 'ethers'
import { styled } from 'styled-components'
import { motion } from 'framer-motion'
import sleep from 'sleep-promise'
import config from './crypto/config.js'
import MiniCanvas from './mini-canvas.jsx'

const Body = styled(motion.div)`
  position: absolute;
  bottom: 55px;
  right: 15px;
  background: #21ff4a1c;
  border: 1px solid #32ff6fd4;
  border-radius: 4px;
`

const MessagesOverflow = styled.div`
  width: 300px;
  height: 200px;
  padding: 10px;
  padding-bottom: 0px;
  overflow-y: scroll;
  overflow-x: hidden;
  border-bottom: 1px solid #32ff6fd4;
`

const Message = styled.div`
  background-color: #e2e2e2ff;
  border-radius: 4px;
  padding: 6px 8px;
  margin: 0px 0px 10px 0px;
  max-width: 300px;
  width: fit-content;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  word-break: break-all;
`

const Author = styled.span`
  color: #666; 
  font-size: 12px;
  font-weight: 700;
  font-family: "SUSE Mono", sans-serif;
`

const Text = styled.span`
  color: #000;
  font-size: 13px;
  font-weight: 400;
  font-family: "SUSE Mono", sans-serif;
  margin-left: 3px;
`

const Navigation = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`

const Input = styled.input`
  background: #ffffff;
  color: #000;
  border: none;
  outline: none;
  max-width: 100%;
  width: 100%;
  height: 30px;
  border-radius: 4px;
  padding: 6px 8px;
  box-sizing: border-box;
  font-family: "SUSE Mono", sans-serif;
  font-size: 13px;
  margin-right: 10px;
`

const Button = styled.button`
  background: #ffffff;
  color: #000;
  border: none;
  outline: none;
  height: 30px;
  border-radius: 4px;
  padding: 6px 8px;
  box-sizing: border-box;
  font-family: "SUSE Mono", sans-serif;
  font-size: 13px;
`

const Chat = () => {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { walletProvider } = useAppKitProvider('eip155')

  const refChat = useRef()

  const [names, setNames] = useState([])
      , [message, setMessage] = useState('')
      , [messages, setMessages] = useState([])

  const createSignerPrivate = async () => {
    if (!walletProvider || !address) {
      open()
      return
    }

    const provider = new BrowserProvider(walletProvider)
    const network = await provider.getNetwork()
    const signer = await provider.getSigner()
    return [signer, parseInt(network.chainId)]
  }

  const getAuthorByAddress = async (address) => {
    if (!address) {
      return ''
    }
    
    for (let x = 0; x < config.blockChainsData.length; x++) {
      const _wallet = Wallet.createRandom()
      const { receiver: receiverAddress, publicRpc } = config.blockChainsData[x]

      const provider = new JsonRpcProvider(publicRpc)
      const wallet = new Wallet(_wallet.privateKey, provider)

      const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
          , text = await receiver.getAuthorByAddress(address)
      
      if (text) {
        return text
      }
    }

    return ''
  }

  const getMessage = async (nindex, index) => {
    const _wallet = Wallet.createRandom()
    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[nindex]

    const provider = new JsonRpcProvider(publicRpc)
    const wallet = new Wallet(_wallet.privateKey, provider)

    const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
        , text = await receiver.getMessage(index)      

    return text.split(',')
  }

  const getMessageAuthorAddress = async (nindex, index) => {
    const _wallet = Wallet.createRandom()
    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[nindex]

    const provider = new JsonRpcProvider(publicRpc)
    const wallet = new Wallet(_wallet.privateKey, provider)

    const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
        , text = await receiver.getMessageAuthorAddress(index)      

    return text
  }

  const addMessage = async text => {
    try {
      if (!isConnected) {
        alert('Not connected!')
        return
      }
      const [signer, network] = await createSignerPrivate()
      const _address = config.address[network]

      const token = new Contract(_address.token, config.ABI.token, signer)
          , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)

      const allowance = await token.allowance(address, _address.receiver)
          , amount = 3

      if (allowance < amount) {
          const approveTx = await token.approve(_address.receiver, amount)
          await approveTx.wait()
      }

      const calcTx = await receiver.addMessage(text)
      const { status } = await calcTx.wait()
      if (status === 1) {
        return true
      }
    } catch (e) {
      alert(e.message)
    }
  }

  useEffect(() => {
    const authorAddress = names.find(name => !name.author)?.authorAddress
    if (authorAddress) {
      const timeId = setTimeout(async () => {
        const author = await getAuthorByAddress(authorAddress)
        setNames(names => names.map(name => name.authorAddress === authorAddress ? ({ ...name, author }) : name))
      }, 1000)

      return () => clearTimeout(timeId)
    }
  }, [names])

  useEffect(() => {
    setMessages([])
    
    let globalIndex = 0;

    const intervalIds = config.blockChainsData.map((_, nindex) => {
      let index = 0
        , forceIndex = 0

      return setInterval(async () => {
        if (forceIndex === index) {
          forceIndex++
          while (true) {
            const [text = '', time] = await getMessage(nindex, index)
            const authorAddress = await getMessageAuthorAddress(nindex, index)
            const ts = parseInt(time)
            
            if (text !== '') {
              index++
              if (index === 100) {
                index = 0
                forceIndex = 0
              }

              setNames(names => names.find(name => name.authorAddress === authorAddress) ? names : [...names, { authorAddress, author: undefined }])
              setMessages(messages => {
                if (messages.find(message => message.ts === ts)) {
                  return messages
                } else {
                  globalIndex++                  
                  return [...messages, { text, index: globalIndex, ts, authorAddress }].sort((a, b) => a.ts - b.ts)
                }
              })
              return
            }

            await sleep(1000)
          }
        }
      }, 250)
    })

    return () => intervalIds.forEach(clearInterval)
  }, [])

  useEffect(() => {
    const node = refChat.current

    if (node) {
      const timeId = setTimeout(() => {
        node.scrollTo(0, 100000000)
      }, 100)

      return () => clearTimeout(timeId)
    }
  }, [refChat, messages.length])

  return (
    <Body drag>      
      <MessagesOverflow ref={refChat}>
        {
          messages.map(message => {
            const color = `hsl(${100+parseInt(message.authorAddress.slice(2),16)%360},30%,50%)`;

            let $address = null
              , index = null
            
            if (message.text.match(/Draw in canvas/)) {
              const [_address, _index] = message.text.replace(/Draw in canvas /, '').split(' ')
              $address = _address
              index = _index
            }

            return (
              <Message key={message.ts} style={message.authorAddress === address ? { marginLeft: 'auto', background: '#ffffffff' } : {}}>
                <Author style={{ color: color }}>
                  {message.authorAddress === address ? '' : `${(names.find(names => names.authorAddress === message.authorAddress)?.author || 'load...')}:`}
                  {
                    $address 
                      ? (
                        <MiniCanvas address={$address} index={index} />
                      )
                      : (
                        <Text style={message.authorAddress === address ? { marginLeft: '0px' } : {}}>{message.text}</Text>
                      )
                  }
                </Author>
              </Message>
            )
          })
        }
      </MessagesOverflow>
      <Navigation>
        <Input 
          value={message} 
          placeholder='Your message...'
          onChange={({ target: { value } }) => setMessage(value)}  
        />
        <Button 
          onClick={async () => {
            const isSend = await addMessage(message)
            if (isSend) {
              setMessage('')
            }
          }}
        >SEND</Button>
      </Navigation>
    </Body>
  )
}

export default Chat