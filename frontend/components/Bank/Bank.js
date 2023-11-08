"use client"
// Chakra UI
import { Flex, Text, Input, Button, Heading, useToast, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"

// React
import { useState, useEffect } from 'react'

// Wagmi
import { useAccount } from 'wagmi'
import { getContract, prepareWriteContract, watchContractEvent, writeContract, readContract } from '@wagmi/core'

// Viem
import { createPublicClient, http, parseAbiItem  } from 'viem'
import { hardhat } from 'viem/chains'

// Ethers
import { ethers } from "ethers"

// Contract Infos
import { abi, contractAddress } from '@/constants'

const Bank = () => {

    const client = createPublicClient({
        chain: hardhat,
        transport: http(), // HTTP JSON-RPC API
    })

    // Balance of the user State
    const [balance, setBalance] = useState(null)
    // Input States
    const [depositAmount, setDepositAmount] = useState(null)
    const [withdrawAmount, setWithdrawAmount] = useState(null)
    //Events States
    const [depositEvents, setDepositEvents] = useState([])
    const [withdrawEvents, setWithdrawEvents] = useState([]) 

    // Get Connected user's Infos
    const { account, isConnected, address } = useAccount()

    // Toasts
    const toast = useToast()

    // Deposit
    const deposit = async () => {
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: "deposit",
                value: ethers.parseEther(depositAmount)
            });
            const { hash } = await writeContract(request);
            const balance = await getBalanceOfUser()
            setBalance(ethers.formatEther(balance))
            await getEvents()
            toast({
                title: 'Congratulations.',
                description: "You have made a deposit!",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
            return hash;
        } catch (err) {
            console.log(err.message)
            toast({
                title: 'Error.',
                description: "An error occured",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }

    // Withdraw
    const withdraw = async () => {
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: "withdraw",
                args: [ethers.parseEther(withdrawAmount)]
            });
            const { hash } = await writeContract(request);
            const balance = await getBalanceOfUser()
            setBalance(ethers.formatEther(balance))
            await getEvents()
            toast({
                title: 'Congratulations.',
                description: "You have made a withdraw!",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
            return hash;
        } catch (err) {
            console.log(err.message)
            toast({
                title: 'Error.',
                description: "An error occured",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }

    // Get the balance of the user
    const getBalanceOfUser = async() => {
        try {
            const data = await readContract({
                address: contractAddress,
                abi: abi,
                functionName: "getBalanceOfUser",
                account: address
            });
            return data;
        } catch (err) {
            console.log(err.message)
        }
    }

    // Get All the events with Viem
    const getEvents = async() => {
        // Get all the deposit events
        const depositLogs = await client.getLogs({
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            // fromBlock: BigInt(Number(await client.getBlockNumber()) - 15000),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setDepositEvents(depositLogs.map(
            log => ({ 
                address: log.args.account, 
                amount: log.args.amount
            })
        ))

        // Get all the withdraw events
        const withdrawLogs = await client.getLogs({
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 'latest'
        })
        setWithdrawEvents(withdrawLogs.map(
            log => ({ 
                address: log.args.account, 
                amount: log.args.amount
            })
        ))
    }

    useEffect(() => {
        const getBalanceAndEvents = async() => {
            if(!isConnected) return
            const balance = await getBalanceOfUser()
            setBalance(ethers.formatEther(balance))
            await getEvents()
        }
        getBalanceAndEvents()
    }, [address])

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
                        return <Flex key={crypto.randomUUID()}><Text>
                            {event.address.substring(0, 6)}...{event.address.substring(event.address.length - 4)} - {ethers.formatEther(event.amount)} Eth
                        </Text></Flex>
                    }) : <Text>No Deposit Events</Text>}
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Withdraw Events
                </Heading>
                <Flex mt="1rem" direction="column">
                    {withdrawEvents.length > 0 ? withdrawEvents.map((event) => {
                        return <Flex key={crypto.randomUUID()}><Text>
                            {event.address.substring(0, 6)}...{event.address.substring(event.address.length - 4)} - {ethers.formatEther(event.amount)} Eth
                        </Text></Flex>
                    }) : <Text>No Withdraw Events</Text>}
                </Flex>
            </Flex>
        ) : (
            <Flex width="100%" justifyContent="space-between" alignItems="center">
                <Alert status='warning'>
                    <AlertIcon />
                    Please connect your Wallet
                </Alert>
            </Flex>
        )}
        </Flex>
    )
}

export default Bank