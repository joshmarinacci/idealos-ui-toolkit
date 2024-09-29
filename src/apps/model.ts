import {Schema} from "rtds-core";

const S = new Schema()

export const StreetAddress = S.map(
    {
        type: S.string(),
        line1: S.string(),
        line2: S.string(),
        city: S.string(),
        state: S.string(),
        zip: S.string(),
        country: S.string(),
    },
    {
        typeName: 'StreetAddress',
    }
)
export const EmailAddress = S.map(
    {
        // type: S.enum(['home', 'work', 'personal'], 'home'),
        type: S.string(),
        address: S.string(),
    },
    {
        typeName: 'Email',
    }
)
export const PhoneNumber = S.map(
    {
        // type: S.enum(['mobile', 'home', 'work'], 'mobile'),
        type: S.string(),
        number: S.string(),
    },
    {
        typeName: 'PhoneNumber',
    }
)

export const Contact = S.map(
    {
        first: S.string(),
        last: S.string(),
        company: S.string(),
        age: S.number(),
        address: S.list(StreetAddress),
        email: S.list(EmailAddress),
        phone: S.list(PhoneNumber),
    },
    {
        typeName: 'Contact',
    }
)

export const CONTACTS = S.list(Contact)

CONTACTS.push(Contact.cloneWith({
    first:"Josh",
    last:"Marinacci",
    company:"Trunk.io",
    age:49,
    phone:[{
            type:'mobile',
            number:'707-509-9627'
    }]
}))

CONTACTS.push(Contact.cloneWith({
    first:"Evie",
    last:"Hill",
    age: 13,
}))

