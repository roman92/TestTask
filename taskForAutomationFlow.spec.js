/// <reference types="cypress" />

describe('Scenario 1', () => {
    let activeSections = [];
    let activeZonesAndPrice = [];
    let sectionsWithTwoSeatsTogether = [];
    let sectionsWithoutTwoSeatsTogether = [];

    before('go to the app and get active sections and them price', () =>{
        cy.visit("https://my.laphil.com/en/syos2/performance/8928")
        cy.wait(3000)
        cy.get('.syos-level-selector-price-types__item').not('.not-available').not('.bestavailable-order').find('span').each(section => {
            activeZonesAndPrice.push(section.text())
        })
    });

    it('verify two available seats together', () => {

        for (let i = 0; i < activeZonesAndPrice.length; i = i+2){
            activeSections.push({name: activeZonesAndPrice[i], price: activeZonesAndPrice[i+1]})
        }

        activeSections.forEach(section => {
            cy.visit("https://my.laphil.com/en/syos2/performance/8928")
            cy.intercept('POST', 'https://my.laphil.com/en/rest-proxy/Web/Cart/*/Tickets').as('postTickets')

            cy.contains(section.price).click()
            cy.contains('Continue').click()
            // get the number of seats from Rest call (if 0 - there are not two seats together) and print sections with available and unavailable seats in the console
            cy.wait('@postTickets').then( xhr => {
                expect(xhr.response.statusCode).to.equal(200)
                let numberAvailableSeats = xhr.response.body.SeatsReserved;
                if ( numberAvailableSeats == 0)
                    sectionsWithoutTwoSeatsTogether.push(section.name)
                if ( numberAvailableSeats == 2)
                sectionsWithTwoSeatsTogether.push(section.name)
            })
        })
        console.log("Sections with two seats together: " + sectionsWithTwoSeatsTogether);
        console.log("Sections without two seats together: " + sectionsWithoutTwoSeatsTogether);
    })

    it('verify two available separate seats', () => {
        for (let i = 0; i < activeZonesAndPrice.length; i = i+2){
            activeSections.push({name: activeZonesAndPrice[i], price: activeZonesAndPrice[i+1]})
        }

        activeSections.forEach( section => {
            cy.visit("https://my.laphil.com/en/syos2/performance/8928")
            cy.wait(3000)
            cy.get('.decrement').click();
            cy.contains(section.price).click()
            cy.contains('Continue').click()
            //verify that section has at least two seats if section has fewer than 2 seats test will fail
            if(section.name == 'Orchestra E/W'){
                cy.get('#syos-screen-3').find('.seat--available').not('.syos-custom-icon').not('.seat--killed').should('have.length.at.least', 2)
                cy.get('#syos-screen-4').find('.seat--available').not('.syos-custom-icon').not('.seat--killed').should('have.length.at.least', 2)
            }
            else if(section.name == 'Terrace'){
                cy.get('#syos-screen-5').find('.seat--available').not('.syos-custom-icon').not('.seat--killed').should('have.length.at.least', 2)
            }
            else if(section.name == 'Terrace E/W'){
                cy.get('#syos-screen-6').find('.seat--available').not('.syos-custom-icon').not('.seat--killed').should('have.length.at.least', 2)
                cy.get('#syos-screen-7').find('.seat--available').not('.syos-custom-icon').not('.seat--killed').should('have.length.at.least', 2)
            }
            cy.wait(3000)
            cy.contains('Change Section').click();
            cy.contains('Confirm').click()
            cy.wait(3000)
            cy.reload();
        }) 
    })
})

describe('Scenario 2', () => {
    before('go to the app', () =>{
        cy.visit("https://my.laphil.com/en/syos2/performance/8928")
        cy.wait(3000)
    });

    it.only('Verify adding ticket to the card', () => {
        let priceEcpected;
        let informationEcpected;

        cy.contains('Any Best Available Seat').click()
        cy.get('.decrement').click();
        cy.contains('Continue').click()
        cy.wait(3000)
        cy.get('.syos-price__value').then(elem => { priceEcpected = elem.text() })
        cy.get('.syos-lineitem__title').then(elem => { informationEcpected = elem.text() })
        cy.contains('Confirm seats').click()
        cy.get('#primary-content').then( mainInformation => { 
            const quantity = mainInformation.find('.quantity.basket__lineItem__desktop').text()
            const price = mainInformation.find('.price.basket__lineItem__desktop').text()
            expect(quantity).to.equal('1')
            expect(price).to.equal(priceEcpected)
        })
        cy.get('.shared-tickets__table-wrapper').then( seatInformation => { 
            const sectionName = seatInformation.find('.first').text()
            const numderOfSeat = seatInformation.find('.last').text()
            console.log("section: " + sectionName)
            console.log("seat " + numderOfSeat)
            expect(sectionName).to.contains(informationEcpected)
            expect(numderOfSeat).to.contains(informationEcpected)
        })
    })
})
