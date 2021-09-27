import BN from "bn.js";
import { TYPE_AMOUNT } from "src";
import { ITransactionOption } from "../interfaces";
import { Web3SideChainClient, Converter, BaseToken } from "../utils";
import { DepositManager } from "./deposit_manager";
import { ERC20 } from "./erc20";
import { RegistryContract } from "./registry";

export class Ether extends BaseToken {


    constructor(
        isParent: boolean,
        client: Web3SideChainClient,
        public depositManager: DepositManager,
        public registry: RegistryContract,

    ) {

        super({
            isParent: true,
            tokenAddress: null as any,
            tokenContractName: null as any,
            bridgeType: null
        }, client);
    }

    getBalance(userAddress: string, option: ITransactionOption = {}) {
        option.from = userAddress;
        return this.readTransaction(option);
    }

    deposit(amount: TYPE_AMOUNT, option: ITransactionOption = {}) {
        const contract = this.depositManager.contract;
        option.value = Converter.toHex(amount);
        const method = contract.method(
            "depositEther",
        );
        return this.processWrite(method, option);
    }

    transfer(amount: TYPE_AMOUNT, to: string, option: ITransactionOption = {}) {
        const isParent = this.contractParam.isParent;
        if (isParent) {
            option.to = to;
            option.value = Converter.toHex(amount);
            return this.sendTransaction(option);
        }
        return this.registry.contract.method("getWethTokenAddress").read<string>().then(ethAddress => {
            const erc20 = new ERC20(ethAddress, false, this.client, this.depositManager);
            return erc20['getContract']();
        }).then(contract => {
            const method = contract.method(
                "transfer",
                to,
                Converter.toHex(amount)
            );
            return this.processWrite(
                method, option
            );
        });
    }

}