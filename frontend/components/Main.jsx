"use client"
import { v4 as uuidv4 } from 'uuid';
import { Flex, Text, Input, Button, Heading, useToast } from "@chakra-ui/react"
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useContractEvent } from 'wagmi'
import { watchContractEvent } from '@wagmi/core'
import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import Contract from '../../backend/artifacts/contracts/Bank.sol/Bank.json'

import { createPublicClient, http, parseAbiItem  } from 'viem'
import { hardhat } from 'viem/chains'

const Main = () => {

    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    // Will be used for the events (only way)
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

    // Deposit Function
    const { data: dataDeposit, isError: isErrorDeposit, isLoading: isLoadingWrite, isSuccess: isSuccessDeposit, write: depositFunction } = useContractWrite({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'deposit',
    })

    // Withdraw Function
    const { data: dataWithdraw, isError: isErrorWithdraw, isLoading: isLoadingWithdraw, isSuccess: isSuccessWithdraw, write: withdrawFunction } = useContractWrite({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'withdraw',
    })

    // getBalanceOfUser Function 
    const { data, isError, isLoading } = useContractRead({
        address: contractAddress,
        abi: Contract.abi,
        functionName: 'getBalanceOfUser',
        args: [address],
        enabled: !!address,
        watch: true
    })

    // Execute deposit function
    const deposit = async() => {
        depositFunction({ 
            args: [], 
            from: address, 
            value: ethers.utils.parseEther(depositAmount) 
        })
        await getDatas()
    }

    // Execute withdraw function
    const withdraw = async() => {
        withdrawFunction({ 
            args: [ethers.utils.parseEther(withdrawAmount)], 
            from: address,
        })
        await getDatas()
    }

    const getDatas = async() => {
        // get all the deposit events
        const logs = await client.getLogs({
            event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
        })
        let allLogs = []
        logs.forEach(log => {
            allLogs.push(log)
        });
        setDepositEvents(allLogs)

        // get all the withdraw events
        const logs2 = await client.getLogs({
            event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
            fromBlock: 0n,
            toBlock: 1000n
        })
        let allLogs2 = []
        logs2.forEach(log => {
            allLogs2.push(log)
        });
        setWithdrawEvents(allLogs2)

        // get the balance of the user and put it in the state
        setBalance(ethers.utils.formatEther(data))
    }

    // If isConnected or data changes, get the datas
    useEffect(() => {
        console.log(balance)
        if(isConnected) {
            getDatas()
        }
    }, [isConnected, address, data])

    // What happens if the user successfully deposited ethers
    useEffect(() => {
        if(isSuccessDeposit) {
            toast({
                title: 'Congratulations.',
                description: "You have deposited Ethers.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [isSuccessDeposit])

    // What happens if the user tried to deposit ethers but an error occured
    useEffect(() => {
        if(isErrorDeposit) {
            toast({
                title: 'Error.',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [isErrorDeposit])

    // What happens if the user successfully withdrawed ethers
    useEffect(() => {
        if(isSuccessWithdraw) {
            toast({
                title: 'Congratulations.',
                description: "You have withdrawed Ethers.",
                status: 'success',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [isSuccessWithdraw])

    // What happens if the user tried to deposit ethers but an error occured
    useEffect(() => {
        if(isErrorWithdraw) {
            toast({
                title: 'Error.',
                description: "An error occured.",
                status: 'error',
                duration: 4000,
                isClosable: true,
            })
        }
    }, [isErrorWithdraw])

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
                            {event.args.account} - {ethers.utils.formatEther(event.args.amount)} Eth - {event.eventName}
                        </Text></Flex>
                    }) : <Text>No Deposit Events</Text>}
                </Flex>
                <Heading as='h2' size='xl' mt="2rem">
                    Withdraw Events
                </Heading>
                <Flex mt="1rem" direction="column">
                    {withdrawEvents.length > 0 ? withdrawEvents.map((event) => {
                        return <Flex key={uuidv4()}><Text>
                            {event.args.account} - {ethers.utils.formatEther(event.args.amount)} Eth - {event.eventName}
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