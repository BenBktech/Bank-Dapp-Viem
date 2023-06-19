"use client"
import { v4 as uuidv4 } from 'uuid';
import { Flex, Text, Input, Button, Heading } from "@chakra-ui/react"
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useContractEvent  } from 'wagmi'
import { watchContractEvent } from '@wagmi/core'
import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import Contract from '../../backend/artifacts/contracts/Bank.sol/Bank.json'

import { createPublicClient, http, parseAbiItem  } from 'viem'
import { hardhat } from 'viem/chains'

const Main = () => {

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    const client = createPublicClient({
        chain: hardhat,
        transport: http(),
    })

    const [depositAmount, setDepositAmount] = useState(null)
    const [balance, setBalance] = useState(null)
    const [withdrawAmount, setWithdrawAmount] = useState(null)
    const [depositEvents, setDepositEvents] = useState([])
    const [withdrawEvents, setWithdrawEvents] = useState([])

    const { account, isConnected, address } = useAccount()

    const { dataDeposit, isLoadingWrite, isSuccess, write: depositFunction } = useContractWrite({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'deposit',
    })

    const { dataWithdraw, isLoadingWithdraw, isSuccessWithdraw, write: withdrawFunction } = useContractWrite({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'withdraw',
    })

    const { data, isError, isLoading } = useContractRead({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'getBalanceOfUser',
        watch: true
    })

    // useContractEvent({
    //     address: contractAddress,
    //     abi: Contract.abi,
    //     eventName: 'etherDeposited',
    //     listener(log) {
    //       console.log(log)
    //     },
    // })

    useEffect(() => {
        if(isConnected) {
            getDatas()
        }
    }, [isConnected, data])

    const getDatas = async() => {
        // deposit
        const logs = await client.getLogs({
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
        })
        let i = 0;
        let allLogs = []
        logs.forEach(log => {
            allLogs.push(log)
        });
        setDepositEvents(allLogs)
        setBalance(ethers.utils.formatEther(data))

        // withdraw
        const logs2 = await client.getLogs({
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
        })
        i = 0;
        allLogs = []
        logs2.forEach(log => {
            allLogs.push(log)
        });
        setWithdrawEvents(allLogs)
        setBalance(ethers.utils.formatEther(data))
    }

    const deposit = async() => {
        depositFunction({ 
            args: [], 
            from: address, 
            value: ethers.utils.parseEther(depositAmount) 
        })
        getDatas()
    }

    const withdraw = async() => {
        withdrawFunction({ 
            args: [ethers.utils.parseEther(withdrawAmount)], 
            from: address,
        })
        getDatas()
    }

    return (
        <Flex p="2rem" width="100%">
        {isConnected ? (
            <Flex direction="column" width="100%">
                <Heading as='h2' size='xl'>
                    Your balance in the Bank
                </Heading>
                <Text mt="1rem">{balance} Eth</Text>
                <Heading as='h2' size='xl' mt="2rem">
                    Deposit
                </Heading>
                <Flex mt="1rem">
                    <Input onChange={e => setDepositAmount(e.target.value)} placeholder="Amount in Eth" />
                    <Button onClick={() => deposit()} colorScheme="purple">Deposit</Button>
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Withdraw
                </Heading>
                <Flex mt="1rem">
                    <Input onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount in Eth" />
                    <Button onClick={() => withdraw()} colorScheme="purple">Withdraw</Button>
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Deposit Events
                </Heading>
                <Flex mt="1rem" direction="column">
                    {depositEvents.length > 0 ? depositEvents.map((event) => {
                        return <Flex key={uuidv4()}><Text>
                            {event.args.account} - {ethers.utils.formatEther(event.args.amount)} - {event.eventName}
                        </Text></Flex>
                    }) : <Text>No Deposit Events</Text>}
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Withdraw Events
                </Heading>
                <Flex mt="1rem" direction="column">
                    {withdrawEvents.length > 0 ? withdrawEvents.map((event) => {
                        return <Flex key={uuidv4()}><Text>
                            {event.args.account} - {ethers.utils.formatEther(event.args.amount)} - {event.eventName}
                        </Text></Flex>
                    }) : <Text>No Withdraw Events</Text>}
                </Flex>
            </Flex>
        ) : (
            <Flex p="2rem" justifyContent="space-between" alignItems="center">
            <Text>Please connect your Wallet</Text>
            </Flex>
        )}
        </Flex>
    )
}

export default Main