"use client"
import { v4 as uuidv4 } from 'uuid';
import { Flex, Text, Input, Button, Heading, useToast } from "@chakra-ui/react"
import { useAccount } from 'wagmi'
import { getContract, prepareWriteContract, watchContractEvent, writeContract, readContract } from '@wagmi/core'
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

    // Toasts
    const toast = useToast()

    // deposit
    const deposit = async () => {
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: Contract.abi,
                functionName: "deposit",
                value: ethers.utils.parseEther(depositAmount)
            });
            const { hash } = await writeContract(request);
            const balance = await getBalanceOfUser()
            setBalance(ethers.utils.formatEther(balance))
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

    // withdraw
    const withdraw = async () => {
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: Contract.abi,
                functionName: "withdraw",
                args: [ethers.utils.parseEther(withdrawAmount)]
            });
            const { hash } = await writeContract(request);
            const balance = await getBalanceOfUser()
            setBalance(ethers.utils.formatEther(balance))
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

    const getBalanceOfUser = async() => {
        try {
            const data = await readContract({
                address: contractAddress,
                abi: Contract.abi,
                functionName: "getBalanceOfUser",
                account: address
            });
            return data;
        } catch (err) {
            console.log(err.message)
        }
    }

    const getEvents = async() => {
        // get all the deposit events
        const depositLogs = await client.getLogs({
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
        })
        setDepositEvents(depositLogs.map(
            log => ({ 
                address: log.args.account, 
                amount: log.args.amount
            })
        ))

        // get all the withdraw events
        const withdrawLogs = await client.getLogs({
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
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
            if(address !== 'undefined') {
                const balance = await getBalanceOfUser()
                setBalance(ethers.utils.formatEther(balance))
                await getEvents()
            }
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
                        return <Flex key={uuidv4()}><Text>
                            {event.address} - {ethers.utils.formatEther(event.amount)} Eth
                        </Text></Flex>
                    }) : <Text>No Deposit Events</Text>}
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Withdraw Events
                </Heading>
                <Flex mt="1rem" direction="column">
                    {withdrawEvents.length > 0 ? withdrawEvents.map((event) => {
                        return <Flex key={uuidv4()}><Text>
                            {event.address} - {ethers.utils.formatEther(event.amount)} Eth
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