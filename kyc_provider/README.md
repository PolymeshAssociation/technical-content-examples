# Basic example of a KYC provider system

The KYC provider is known as ExKyc.

There are 2 pages:

* `/` for the KYC customer to enter their parameters.
* `/manager` for the KYC internal system to handle requests.

For the avoidance of doubt, this is meant as an example of KYC, and not CDD for Polymesh.

You need some setup before using it.

1. Enter your `keys.json` following the model found in `keys.json.sample`.

## `/`

In this simplified version, a customer is known by its id. You can use any id, even one from someone else. This security loophole is left open to simplify the system.

The customer information is split into 2 parts:

* The basic self-explanatory information: name, jurisdiction...
* The Polymesh identification, only in `post-polymesh`

These 2 parts can be updated separately.

On this page, the customer can only see, not update, "EzKyc's decision" with regards to being "verified".

The server will automatically publish a claim if:

1. the customer is already verified by EzKyc.
2. the customer submits a new or updated Polymesh did.

## `/manager`

On this page, an EzKyc employee can:

* See, not modify, a customer's information
* Accept or reject the information provided.

The server will automatically publish a claim if:

1. the customer has provided a Polymesh did.
1. the EzKyc employee accepts the documents.
