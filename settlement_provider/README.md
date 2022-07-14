# Basic example of a settlement provider

The exchange is known as NextDaq.

There are 4 pages:

* `/` where you can jump to the other pages.
* `/trader/` where you can set up orders by traders.
* `/exchange` where the exchange can manually match orders and create pending settlements.
* `/custodian` where custodians and traders can go and settle their parts of each settlement.

You need some setup before using it.

1. Enter your `keys.json` following the model found in `keys.json.sample`.
2. Enter your own exchange `venueId` and `usdToken`  in `next.config.js`.

## Scripted setup

If you need more things to be prepared, like a stable coin or a venue, look into `./scripts/setupPreparation.ts`. In there you can adjust for your preferred parameters.

To run this script:

```sh
$ npm run setup
```
It is an interactive process that can be restarted at any point. You do not need to duplicate actions if you restart. Example:

```
Network: wss://testnet-rpc.polymesh.live, preset venue id: 90, USD token: DEEPUSD2
Your account is 0x35a84a72dccf1070bb36e6335456617df993f9be1feb2b52b18c58c0d9008443, you have 96999.358735 free POLYX and 0 locked ones
You do not have any venues at all
✔ Create 1 Exchange venue now? y/n … y
✔ What details to add? … Best exchange
Venue created. Save its id, 95, in the config
DEEPUSD2 does not exist
✔ Reserve the security token DEEPUSD2? y/n … y
DEEPUSD2 is now reserved by you
✔ Create the security token DEEPUSD2? y/n … y
✔ With what total supply? … 1000000000
supply 1000000000
DEEPUSD2 is now created by you
You have 1000000000 DEEPUSD2, of which 0 are locked
✔ Send DEEPUSD2 to others? y/n … y
✔ Which account Did? … 0x8efe473faf995715699f625c79c2f118621974521a60b3eda226e5108f38ee1a
✔ By what amount? … 100000
Recipient portfolios:
1 - NextDaq Custody
✔ In which portfolio? (default: default portfolio) … 
✔ Send DEEPUSD2 to others? y/n … n
instruction 225 mined
You have 1 pending instructions: 225
```
In this case, the recipient of this instruction should open the `/custodian` page and accept the instruction.

## `/trader`

In this simplified version, a trader is known by its id. You can give any id, even one from someone else. There can be only 1 order per trader id at any one time. In effect, making it an order id.

The other parameters of the order are self-explanatory.

### Set the custodian

This `/trader` page, in the `post-polymesh` branch, also allows a trader to set the custodian on a portfolio. As the trader:

1. Enter your account's `did` in the "Trader's Polymesh did" field.
2. Give it a second, or more, to load your portfolios.
3. Select the portfolio for which you want to give custody.
4. Paste the custodian's `did` in the "Custodian's Polymesh did" field.
5. Click "Invite Custodian"
6. Proceed with the signature.

The outgoing request should appear in the "Your outgoing custody authorisation requests" box.

Switch to the custodian's account. And:

1. Load the request in "Your incoming custody authorisation requests".
2. Click accept or reject.
3. Proceed with the signature.
4. See the portfolio appear in "Your custodied portfolios", or load it manually.

When acting as a custodian, you can enter an order on behalf of a trader. It is possible to simply pick the desired portfolio from the list of custodied portfolios.

## `/exchange`

In this simplified version, the exchange does not automatically match orders. Instead, you are presented with 2 conveniently sorted lists:

* Sell orders on the left.
* Buy orders on the right.

Select 1 order from each side and click "Submit the match". With this, the server will make the match, in particular:

1. Decide the price by taking the average of both orders.
2. Choose the maximum possible quantity.
3. Save a new settlement in the database.
4. Remove the order that got used up in full.
5. Update or remove the other order, depending on whether it was used up in full.
6. For `post-polymesh`, also create an instruction in the exchange's venue.

When an order has been removed, its former id can be reused. In effect

## `/custodian`

In this simplified version, you can load all the pending settlements pertaining to a trader id. For each of them, the page tries its best to activate only the buttons relevant to you. Again there is no login or safety when a party claims having paid or transferred. It is meant to be simple.

In the `post-polymesh` version, you can also load the "Settlements under your custody and missing from the list above". They are loaded from the Polymesh venue itself.

It is conceivable to imagine a `post-polymesh` scenario where the exchange no longer serves the list of pending settlements, instead letting the custodians rely on the Polymesh venue. In this scenario, the exchange would only check that the settlements in its records are being handled eventually.
