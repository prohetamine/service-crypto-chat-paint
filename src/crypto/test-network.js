import { defineChain } from '@reown/appkit/networks'

const ip = '192.168.50.143'

export default [
  {
    network: defineChain({
      id: 31337,
      chainNamespace: "eip155",
      name: "networkTest",
      rpcUrls: {
        default: {
          http: [`http://${ip}:8545`],
        }
      }
    }),
    token: '0x512F7469BcC83089497506b5df64c6E246B39925',
    receiver: '0xFE92134da38df8c399A90a540f20187D19216E05',
    publicRpc: `http://${ip}:8545`
  },
  {
    network: defineChain({
      id: 14188,
      chainNamespace: "eip155",
      name: "networkTest2",
      rpcUrls: {
        default: {
          http: [`http://${ip}:8546`],
        }
      }
    }),
    token: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    receiver: '0xF32D39ff9f6Aa7a7A64d7a4F00a54826Ef791a55',
    publicRpc: `http://${ip}:8546`
  }
]