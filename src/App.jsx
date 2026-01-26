/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { styled } from 'styled-components'
import { motion } from 'framer-motion'
import Chat from './chat.jsx'
import Profile from './profile.jsx'
import CanvasComponent from './canvas.jsx'

const Body = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
`

const WalletButton = styled(motion.button)`
  position: absolute;
  right: 15px;
  top: 15px;
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

const NavLinks = styled.div`
  position: absolute;
  right: 15px;
  bottom: 15px;
  font-size: 15px;
  font-family: "SUSE Mono", sans-serif; 
  display: flex;
`

const Link = styled(motion.div)`
  margin-left: 10px;
  cursor: pointer;
  text-decoration: underline;
`

const App = () => {
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount({ namespace: 'eip155' })

  return (
    <Body>
      <WalletButton onClick={() => open()}>{isConnected ? 'Wallet' : 'Connect wallet'}</WalletButton>
      <Profile />
      <Chat />
      <CanvasComponent />
      <NavLinks>
        <Link 
          className='link'
          drag
          dragTransition={{
            bounceStiffness: 100,
            bounceDamping: 10
          }}
          dragSnapToOrigin
          whileDrag={{
            scale: 1.05,
            cursor: 'grab'
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => setTimeout(() => window.open('https://prohetamine.ru/web3', '_blank'), 100)}
        >Prohetamine/WEB3</Link>
        <Link 
          className='link'
          drag
          dragTransition={{
            bounceStiffness: 100,
            bounceDamping: 10
          }}
          dragSnapToOrigin
          whileDrag={{
            scale: 1.05,
            cursor: 'grab'
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => setTimeout(() => window.open('https://pancakeswap.finance/swap?chain=bsc&chainOut=bsc&inputCurrency=BNB&outputCurrency=0xD566886eB93500e2BA464bd48c8D5A2556569253&exactAmount=1000&exactField=OUTPUT', '_blank'), 100)}
        >PancakeSwap</Link>
        <Link 
          className='link'
          drag
          dragTransition={{
            bounceStiffness: 100,
            bounceDamping: 10
          }}
          dragSnapToOrigin
          whileDrag={{
            scale: 1.05,
            cursor: 'grab'
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => setTimeout(() => window.open('https://dexscreener.com/bsc/0xD566886eB93500e2BA464bd48c8D5A2556569253', '_blank'), 100)}
        >Dexscreener</Link>
        <Link 
          className='link'
          drag
          dragTransition={{
            bounceStiffness: 100,
            bounceDamping: 10
          }}
          dragSnapToOrigin
          whileDrag={{
            scale: 1.05,
            cursor: 'grab'
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => setTimeout(() => window.open('https://bscscan.com/token/0x7AEBC62dCA879186D5F39A65A73dB27BeC6b7296', '_blank'), 100)}
        >Contract</Link>
        <Link 
          className='link'
          drag
          dragTransition={{
            bounceStiffness: 100,
            bounceDamping: 10
          }}
          dragSnapToOrigin
          whileDrag={{
            scale: 1.05,
            cursor: 'grab'
          }}
          style={{ cursor: 'pointer' }}
          onClick={() => setTimeout(() => window.open('https://github.com/prohetamine/service-crypto-chat-paint', '_blank'), 100)}
        >GitHub</Link>
      </NavLinks>
    </Body>
  )
}

export default App