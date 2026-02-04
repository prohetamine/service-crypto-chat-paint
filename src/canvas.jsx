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

const Body = styled(motion.div)`
  background: #21ff4a1c;
  display: flex;
  flex-direction: column;
  border-radius: 10px 0px 0px 0px;
`

const Canvas = styled(motion.canvas)`
  background: #21ff4a1c;
  border: 1px solid #32ff6fd4;
`

const Button = styled.button`
  background: #ffffff;
  color: #000;
  border: none;
  outline: none;
  height: 30px;
  min-width: 30px;
  border-radius: 4px;
  padding: 6px 8px;
  box-sizing: border-box;
  font-family: "SUSE Mono", sans-serif;
  font-size: 13px;
`

const Navigation = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`

const CanvasComponent = () => {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { walletProvider } = useAppKitProvider('eip155')

  const refCanvas = useRef()

  const [names, setNames] = useState([])
      , [draw, setDraw] = useState([])
      , [selectColor, setSelectColor] = useState('#fff')
      , [draws, setDraws] = useState([])

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

  const getDraw = async (nindex, index) => {
    const _wallet = Wallet.createRandom()
    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[nindex]

    const provider = new JsonRpcProvider(publicRpc)
    const wallet = new Wallet(_wallet.privateKey, provider)

    const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
        , data = await receiver.getDraw(index)      

    return data.split('|')
  }

  const getDrawAuthorAddress = async (nindex, index) => {
    const _wallet = Wallet.createRandom()
    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[nindex]

    const provider = new JsonRpcProvider(publicRpc)
    const wallet = new Wallet(_wallet.privateKey, provider)

    const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
        , text = await receiver.getDrawAuthorAddress(index)      

    return text
  }

  const addDraw = async drawData => {
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

      const MAX = 382000000
      if (allowance < MAX) {
          const approveTx = await token.approve(_address.receiver, MAX)
          await approveTx.wait()
      }

      const calcTx = await receiver.addDraw(drawData)
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
    setDraws([])
    
    let globalIndex = 0;
    
    const intervalIds = config.blockChainsData.map((_, nindex) => {
      let index = 1
        , forceIndex = 1

      return setInterval(async () => {
        if (forceIndex === index) {
          forceIndex++
          while (true) {
            const [draw, time] = await getDraw(nindex, index)
            const authorAddress = await getDrawAuthorAddress(nindex, index)
            const ts = parseInt(time)

            if (draw !== '') {
              index++

              globalIndex++
              setNames(names => names.find(name => name.authorAddress === authorAddress) ? names : [...names, { authorAddress, author: undefined }])
              setDraws(draws => {
                const dd = draw.split(',').reduce((ctx, elem) => {
                  if (parseInt(elem) !== elem-0) {
                    ctx.push({ color: elem })
                    return ctx
                  }

                  if (ctx[ctx.length - 1].x === undefined) {
                    ctx[ctx.length - 1] = { ...ctx[ctx.length - 1], x: parseInt(elem) }
                    return ctx
                  } 

                  if (ctx[ctx.length - 1].y === undefined) {
                    ctx[ctx.length - 1] = { ...ctx[ctx.length - 1], y: parseInt(elem) }
                    return ctx
                  }
                  
                  ctx.push({ x: parseInt(elem) })

                  return ctx
                }, [[]])
                return [...draws, { ts, index: globalIndex, data: dd, authorAddress }].sort((a, b) => a.ts - b.ts)
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
    const node = refCanvas.current

    if (node) {
      let isDown = false
        , offsetX = 0
        , offsetY = 0

      node.width = 400
      node.height = 400

      const blockHeight = node.height / 20
          , blockWidth = node.height / 20

      const ctx = node.getContext('2d')

      let drawData = []

      const render = () => {
        ctx.clearRect(0, 0, node.width, node.height)

        draws.map(draw => draw.data).forEach(chunk => {
          const { color } = chunk[chunk.length - 1] || { color: '#fff' }
          const _color = ['#fff', '#000', 'red', 'blue', 'green', 'pink', '#f3dc1d', '#909'].find(_color => _color === color) || '#fff'
          ctx.fillStyle = _color
          chunk.forEach(draw => 
            _color === '#000' 
              ? ctx.clearRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)
              : ctx.fillRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)
          )
        })

        ctx.fillStyle = selectColor
        
        ;[...draw, ...drawData].forEach(draw => {
          selectColor === '#000'
            ? ctx.clearRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)
            : ctx.fillRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)
        })

        for (let x = 0; x < node.width; x += blockWidth) {
          for (let y = 0; y < node.height; y += blockHeight) {
            if (
              offsetX > x && offsetX < x + blockWidth &&
              offsetY > y && offsetY < y + blockHeight
            ) {
              ctx.fillRect(x, y, blockWidth, blockHeight)
              drawData.push({ x: x / blockWidth, y: y / blockHeight })
            }
          }
        }
      }

      render()

      const handleMouseDown = e => {
        e.stopPropagation()
        offsetX = e.offsetX
        offsetY = e.offsetY
        render()
        isDown = true
      }
      
      const handleMouseUp = e => {
        e.stopPropagation()
        setDraw(draws => [...draws, ...drawData])
        isDown = false
      }
      
      const handleMouseMove = e => {
        e.stopPropagation()
        if (isDown) {
          offsetX = e.offsetX
          offsetY = e.offsetY
          render()
        }
      }

      node.addEventListener('mousedown', handleMouseDown)
      node.addEventListener('mouseup', handleMouseUp)
      node.addEventListener('mousemove', handleMouseMove)

      return () => {
        node.removeEventListener('mousedown', handleMouseDown)
        node.removeEventListener('mouseup', handleMouseUp)
        node.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [refCanvas, draws, draw, selectColor])

  return (
    <Body drag>      
      <Canvas onPointerDownCapture={(e) => e.stopPropagation()} ref={refCanvas}></Canvas>
      <Navigation>
        <Button style={{ background: '#fff' }} onClick={async () => setSelectColor('#fff')}>{selectColor === '#fff' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: '#000' }} onClick={async () => setSelectColor('#000')}>{selectColor === '#000' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: 'red' }} onClick={async () => setSelectColor('red')}>{selectColor === 'red' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: 'green' }} onClick={async () => setSelectColor('green')}>{selectColor === 'green' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: '#909' }} onClick={async () => setSelectColor('#909')}>{selectColor === '#909' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: 'blue' }} onClick={async () => setSelectColor('blue')}>{selectColor === 'blue' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: 'pink' }} onClick={async () => setSelectColor('pink')}>{selectColor === 'pink' ? '●' : ''}</Button>
        <Button style={{ marginLeft: '10px', background: '#f3dc1d' }} onClick={async () => setSelectColor('#f3dc1d')}>{selectColor === '#f3dc1d' ? '●' : ''}</Button>
      </Navigation>
      <Navigation>
        <Button 
          onClick={async () => {  
            const drawData = `${Object.keys(draw.map(d => d.x+','+d.y).reduce((ctx, coord) => {
              ctx[coord] = true 
              return ctx
            }, {})).join(',')},${selectColor}`
            const isSend = await addDraw(drawData)
            if (isSend) {
              setDraw([])
            }
          }}
        >Draw BlockChain</Button>
        <Button
          style={{ marginLeft: '10px' }} 
          onClick={async () => {  
            setDraw([])
          }}
        >Clean</Button>
      </Navigation> 
    </Body>
  )
}

export default CanvasComponent