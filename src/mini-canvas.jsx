/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { Contract, Wallet, JsonRpcProvider } from 'ethers'
import { styled } from 'styled-components'
import config from './crypto/config.js'

const Canvas = styled.canvas`
  background: #21ff4a1c;
  border: 1px solid #32ff6fd4;
  background:#676;
`

const MiniCanvas = ({ address: _address, index, onRemove }) => {
  const refCanvas = useRef()

  const [draw, setDraw] = useState({
    data: []
  })

  const getDraw = async (nindex, index) => {
    const _wallet = Wallet.createRandom()
    const { receiver: receiverAddress, publicRpc } = config.blockChainsData[nindex]

    const provider = new JsonRpcProvider(publicRpc)
    const wallet = new Wallet(_wallet.privateKey, provider)

    const receiver = new Contract(receiverAddress, config.ABI.receiver, wallet)
        , data = await receiver.getDraw(index)
    
    return data.split('|')
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

  useEffect(() => {
    const intervalIds = config.blockChainsData.map((_, nindex) => {
      return setTimeout(async () => {
        const [draw] = await getDraw(nindex, index)
        const authorAddress = await getMessageAuthorAddress(nindex, index)

        if (draw.length !== 0) {
          const dd = draw.split(',').reduce((ctx, elem) => {
            if (parseInt(elem) !== elem - 0) {
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

          setDraw({ data: dd, authorAddress })
        }
      }, 1000)
    })

    return () => intervalIds.forEach(clearTimeout)
  }, [index])
  
  useEffect(() => {
    const node = refCanvas.current

    if (node) {
      node.width = 40
      node.height = 40

      const blockHeight = node.height / 20
          , blockWidth = node.height / 20

      const ctx = node.getContext('2d')
      const render = () => {
        ctx.clearRect(0, 0, node.width, node.height)

        const { color } = draw.data[draw.data.length - 1] || ({ color: '#fff' })
        const _color = ['#fff', '#000', 'red', 'blue', 'green', 'pink', '#f3dc1d', '#909'].find(_color => _color === color) || '#fff'
        ctx.fillStyle = _color
        draw.data.forEach(draw => 
          _color === '#000'
            ? ctx.clearRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)  
            : ctx.fillRect(draw.x * blockWidth, draw.y * blockHeight, blockWidth, blockHeight)
        )
      }

      render()
    }
  }, [refCanvas, draw])

  return (
    <Canvas ref={refCanvas}></Canvas>
  )
}

export default MiniCanvas