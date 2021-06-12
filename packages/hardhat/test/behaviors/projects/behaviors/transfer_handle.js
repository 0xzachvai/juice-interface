const { ethers } = require("hardhat");
const { expect } = require("chai");

const tests = {
  success: [
    {
      description: "transfers handle",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        newHandle: ethers.utils.formatBytes32String("some-new-handle"),
        setup: {
          create: {
            owner: deployer.address,
            handle: ethers.utils.formatBytes32String("some-handle")
          }
        }
      })
    },
    {
      description: "called by operator",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        newHandle: ethers.utils.formatBytes32String("some-new-handle"),
        setup: {
          create: {
            owner: addrs[1].address,
            handle: ethers.utils.formatBytes32String("some-handle")
          },
          permissionFlag: true
        }
      })
    }
  ],
  failure: [
    {
      description: "unauthorized",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        newHandle: ethers.utils.formatBytes32String("some-handle"),
        setup: {
          create: {
            owner: addrs[0].address,
            handle: ethers.utils.formatBytes32String("some-old-handle")
          },
          permissionFlag: false
        },
        revert: "Operatable: UNAUTHORIZED"
      })
    },
    {
      description: "no handle",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        newHandle: ethers.utils.formatBytes32String(""),
        setup: {
          create: {
            owner: deployer.address,
            handle: ethers.utils.formatBytes32String("some-old-handle")
          }
        },
        revert: "Projects::transferHandle: EMPTY_HANDLE"
      })
    },
    {
      description: "handle taken",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        newHandle: ethers.utils.formatBytes32String("some-handle"),
        setup: {
          create: {
            owner: deployer.address,
            handle: ethers.utils.formatBytes32String("some-handle")
          }
        },
        revert: "Projects::transferHandle: HANDLE_TAKEN"
      })
    },
    {
      description: "handle being transfered",
      fn: ({ deployer, addrs }) => ({
        caller: deployer,
        to: addrs[0].address,
        owner: deployer.address,
        newHandle: ethers.utils.formatBytes32String("some-new-handle"),
        setup: {
          create: {
            owner: deployer.address,
            handle: ethers.utils.formatBytes32String("some-handle")
          },
          transfer: {
            owner: deployer.address,
            to: addrs[0].address,
            handle: ethers.utils.formatBytes32String("some-new-handle")
          }
        },
        revert: "Projects::transferHandle: HANDLE_TAKEN"
      })
    }
  ]
};

module.exports = function() {
  describe("Success cases", function() {
    tests.success.forEach(function(successTest) {
      it(successTest.description, async function() {
        const {
          caller,
          to,
          newHandle,
          setup: { create, permissionFlag } = {}
        } = successTest.fn(this);

        // Setup by creating a project.
        await this.contract
          .connect(caller)
          .create(create.owner, create.handle, "");
        if (permissionFlag !== undefined) {
          const permissionIndex = await this.contract.setHandlePermissionIndex();

          // Mock the caller to be the project's controller.
          await this.operatorStore.mock.hasPermission
            .withArgs(create.owner, 1, caller.address, permissionIndex)
            .returns(permissionFlag);
        }

        // Execute the transaction.
        const tx = await this.contract
          .connect(caller)
          .transferHandle(1, to, newHandle);

        // Expect an event to have been emitted.
        expect(tx)
          .to.emit(this.contract, "TransferHandle")
          .withArgs(1, to, create.handle, newHandle, caller.address);

        // Get the stored reverse handle lookup value.
        const storedReverseHandleLookup = await this.contract.reverseHandleLookup(
          1
        );

        // Get the stored handle resolver value.
        const storedTransferedHandleResolver = await this.contract.handleResolver(
          create.handle
        );

        const storedNewHandleResolver = await this.contract.handleResolver(
          newHandle
        );

        const storedTransferedHandles = await this.contract.transferedHandles(
          create.handle
        );

        // Expect the stored values to equal the set values.
        expect(storedReverseHandleLookup).to.equal(newHandle);
        expect(storedTransferedHandleResolver).to.equal(0);
        expect(storedNewHandleResolver).to.equal(1);
        expect(storedTransferedHandles).to.equal(to);
      });
    });
  });
  describe("Failure cases", function() {
    tests.failure.forEach(function(failureTest) {
      it(failureTest.description, async function() {
        const {
          caller,
          to,
          newHandle,
          setup: { create, transfer, permissionFlag } = {},
          revert
        } = failureTest.fn(this);

        // Setup by creating a project.
        await this.contract
          .connect(caller)
          .create(create.owner, create.handle, "");
        if (transfer) {
          await this.contract
            .connect(caller)
            .transferHandle(1, transfer.to, transfer.handle);
        }
        if (permissionFlag !== undefined) {
          const permissionIndex = await this.contract.setHandlePermissionIndex();

          // Mock the caller to be the project's controller.
          await this.operatorStore.mock.hasPermission
            .withArgs(create.owner, 1, caller.address, permissionIndex)
            .returns(permissionFlag);
        }

        // Execute the transaction.
        await expect(
          this.contract.connect(caller).transferHandle(1, to, newHandle)
        ).to.be.revertedWith(revert);
      });
    });
  });
};
