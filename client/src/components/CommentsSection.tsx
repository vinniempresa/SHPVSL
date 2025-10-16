import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';

interface Comment {
  id: number;
  name: string;
  gender: "M" | "F";
  message: string;
  likes: number;
  timeAgo: string;
  profileImage: string;
  replies?: Comment[];
  isReply?: boolean;
}

const profileImages = {
  men: [
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/502578848_9876083289153468_4046710841254946707_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=LFEMzxoZFoUQ7kNvwHje1nN&_nc_oc=AdlIQ5_qkAKtqTEb1cXOJ0gTQjrRyexuxyCfFH_BVHx4-kdQQZx7GxDHpcQFImf8xAmLjj066-pDjQJ4RuXNdZHx&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=dRVTbSA9drGW8PdUHc80bw&oh=00_AfZXSwHhsx7nvq6cMV72XnDW-Lhd8NTzs5xfG_ABiRYI8Q&oe=68D3D4B4",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/46115522_1110968849065045_2668519337702195200_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=3i_O36Q3GsYQ7kNvwEj3U8s&_nc_oc=AdmRq4kSYPe8RuLcvPRu8KE6f26apB8mw17MezdWKrBw2s_ORT9EXC5P7nn_MYwiPPIFJu9Mt9O4ziAHnxRgZAiw&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=pOFwd8XTkUhgX4Uf87DIsg&oh=00_Afa5i3DVbOrAbYt_P_bX38JPNpZsoWxD5jA6riup7MJEnA&oe=68F54DE4",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/125569600_4230737243609287_3967131514222108780_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=XuLMqer6Og4Q7kNvwGiszVf&_nc_oc=Adl_t7x18YLrdqY6JL_R374jjNUBjYEK7u_GAqaP3XCqe20EwRll6k_no4bZB4o7YStufwgyvlBogDqUaIcH8oQF&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=Q6SfAK5Ml3h-qkgcoE8GTA&oh=00_AfakiyBt8aM0XVNjCK8jGbhHnEhtsZSrJEjJ7WyLdlU7vQ&oe=68F57157",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/117642521_3162684067147368_6477709627897357665_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=0h3AbnBa2-EQ7kNvwFIV59V&_nc_oc=AdlkzlsvsMZOneQ9t7yCxR50Lus8OBgF-E5rbhZxz-0gmX4_neQ8YpVVagaJ0ssqIA4pFySUdMQDxDLIhHK1nU1a&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=I-vMcViUbRvgaMNpiQv1sg&oh=00_AfaeTjAc0TxQRqgDl0Agr9eHF00_FAqIclVtmnoc6nj04g&oe=68F57230",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/35428326_2373982669285586_7798509717214461952_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=5Hg5b7XwUs4Q7kNvwFUKVGr&_nc_oc=Adlu1g8p2zUaXLGAa2tv4hOLYihDPejpxcMGqbJmPKGHZAT39aC6yQ1CW5Iy0MIlERwwmDbCFKK8vo5ead5HGGUX&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=hXFo28Ld721vOZOZxrUOeg&oh=00_AfbSA5IRbGqEoDV4PtuhkJ1Q7T6gdHP31WhJs2m4izXXuw&oe=68F54E61",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/44800709_193630054863696_2571333320239480832_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=uza0tkEIGroQ7kNvwF3cZDy&_nc_oc=Adk9_zktgMLioza307mY_Q8OAvt8FsdZpZ4kDT_C2rnGTmVWl7h5I_7lEu8KsDTk2oPj7eCWiEcpgsSjYzt8HHoz&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=Knkkcv09XN6RuBLdGRtYrg&oh=00_Afav5Jxl05tAnQZwr2lZwgYeQ6aZtTEOStsd1AXK7OS3BA&oe=68F5616E",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/240525894_2372150476250968_468703669774551192_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=IrrL6o3u7EwQ7kNvwGTo7wa&_nc_oc=AdmotAvsL0n4h_eT_EEL6j9ST56fZlJr3RcD28sQ1Lp9wJawMmoRPcFjA9JAO_RRSKH9QpLOTOKZUFk2VX6HhaGp&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=sbKtEZr658D5WfWdwgGEPg&oh=00_AfaIw9VXwbhe754aCNALIMWMemsdkud7p3SPj3BWvam_aQ&oe=68D3A84B",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t1.6435-9/186474682_10159246336497866_3964090686294664894_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=V38JwPIk5tAQ7kNvwHrYbRv&_nc_oc=AdkMuW3fNLq8GC4pKi3gN9cz9Q_NMfb7uQWXSYWnijs1eZgu_ml4Q8L_Cc41J7CJ3bieCMRV9UdbCr6xfcy0LSjH&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=9o5dBhAR2umxC6QHIUOYbw&oh=00_Afa1FYa_ZKaY6BNwt35B0F2eoGkKis0phGGmkFoiDiuuTQ&oe=68F56E22",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/465674547_2768031063367775_4107922792035598904_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=mM_RjbovOR4Q7kNvwEf-0q0&_nc_oc=Adk9bt2YiVXBKYpwt-K9CSSJk_C6Fu9w-JB-QW8wygcDj0hWtcmdVjK8xaFNrsMLZ_dIj8srUFyP114u-Qs34UmP&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=cxt5t-mj4TM1Qk7TNvOY1g&oh=00_AfabnlmFANPc86-WmmkP2F_LdScrt59ZoG3__o2aLeaP0Q&oe=68D3C6AE",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/329163340_1665584850557769_7952852576412662255_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=b-jDHW0yJegQ7kNvwF13tDF&_nc_oc=AdlSfTcWzldGer5kApqvcQnH-U80Slo2s5W2G3pgfzwpc5hkdqttwormwh9RCYlIiiXJqLTfjuvx109jZQN7nPms&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=aij5m0v7mEHZ7fNndPPt5g&oh=00_Afa2f5viMgJmqwb7vuqwH9EcbQBus9q3m7OJQbv0oF8iKw&oe=68D3ADF6",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/549268678_757062737119730_5802808584963787421_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=PF2s5aw0AlIQ7kNvwEp71yL&_nc_oc=AdnMfoGRUPRinX8PTNWCSMyPc5ZZIc3nChPUkKaznrHtqaPIxPc4bwXl4NQUBm1pdzbuHLHNpYIuIWGu3XyiKgwR&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=RbhT8rObkwopjv7WSRvrkA&oh=00_AfYNvrlVEBbm5YZycVusseaTndGlp9YC8bQ-6BobyMuglw&oe=68D3B644",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/506605486_23960893180217648_2180478305755056771_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=VGkUGyG4Ra8Q7kNvwEH_mzW&_nc_oc=Adnpj1-rlhpxKgT8t_4Io6af6YpsToYyIGL4y1T_46GYyyLqiQdieUIwvy0hdpCRwCyOi4-hmD7gtKrJMnic3wfy&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=v_z4GXjlYzJ9AxDldwbMWA&oh=00_AfYsu5Lj9zdwRNlsPR1aORnH5XF2kwS_pPHWD4UpZ9CslA&oe=68D3D116",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/289987213_10217065152140291_6105566584715682327_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=KVV4EbW9eAwQ7kNvwEqXGgy&_nc_oc=Adk210p6B4QPdPmGkWnx5-f6gG7fjcw88iZPzMTh99059Vkj8DoH2IPnatDCMecU8SgoGUqQDpVQkranSQ8FVSQJ&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=oYqopcR6uDugIbxZvbkC-g&oh=00_AfbxqkHivGKMz0WLyNcalnGWBpWoZeGTPo-W7XTqHwAkLw&oe=68D3B066",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/370157804_3458899707692320_7180734128752435178_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=aF8VtJwXZu4Q7kNvwGgVgUm&_nc_oc=AdmP6rJ8eHqOBfgJvt8-2lM0a_iNuHJvkQT_oRmRQ9VKTbz9JRUcMgb0x8WLPZ6TgQzgqQW5sI8bN8zfKjjJvP9T&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=bX3kQf2H7u9bM5eK8dHsqQ&oh=00_Afb2D3g5Jk8TwNRNKHuGJiNshD_Zk3yFvAg9qZl7LQiT7w&oe=68D3AF42",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/482080356_1100022178479494_6625700935909497643_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=CEGBnChBYD8Q7kNvwGipFIU&_nc_oc=Adk8QaC2AccUq_QiH-_jxu__RXRkz18VjDFj6aB_4blNxEpEoK_cAxuMR_I9L8YaBkc1u7O6CLG74dHvPnHnL8JZ&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=RgOswtcaW9p59uGPnWhr3A&oh=00_AfamVaSfXdj2Mtg7J6-X-0E4MXGepKYmPNXMIcAL93h9cg&oe=68D3CD63"
  ],
  women: [
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/456898475_122100240176493882_297836300689732551_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=T0FetNWia5UQ7kNvwFIns7_&_nc_oc=Adm2S_dmb0ZC5RnBnFGDXIVqK07E0i6zVEQqnbBqADEsnnJI2yW1TiSgPqdxSuFDoXuM2pNGJeNNIMjHmcbb7EAN&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=kIMOCtuxW7yfGcHgrpK4gA&oh=00_AfYxFbI0jS0s-5AtyuOH14eI2QydV8mPsnj_l3IC-LSslQ&oe=68D3CC97",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/494285947_122213737604142946_3742278127504359779_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=D6E4J4gjmhAQ7kNvwGcuWMW&_nc_oc=AdkDGS2WEMtaOMxY_KZib6EzSnNJufwuUkw3usfOnrXFzEFUG-0b7C8kzsYd_uylBOq_3_dMc_FmpC6Lp205MzjM&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=atb-kut7yETUbkEdKi4w8Q&oh=00_AfY2FPdWFR3kaEO4CFDGMbBLZKViV7bBT-mXmB86ULoCeg&oe=68D3A923",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/358643273_106236479203496_7441861712509134755_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Iw3CNd9qHzAQ7kNvwHKZ5Fv&_nc_oc=Adks_YMnudAedLmWi1QrLKuUmdbO4qEIFyhnUuguAgPS_4TPunu2iiDVm0a3BPYUr4i3pEsuWq3yseA4f2nIO3hN&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=im1W4I45NjykRO5ya_7Q1g&oh=00_AfYbGnfuyxSN23HGNFW4tMwwGerLWP7mypUdvWX_FjBzbA&oe=68D3BC4C",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/481207490_122099098184791030_8588160524368125998_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=gGbRr0L7Oa4Q7kNvwFqAo0K&_nc_oc=AdmO4LTWcdl-PPbpUpjWqPs8CrjDPoc5-EkJwfPpIqrRm0gC_Yo6jM9NbTfIO1gkSzEhdd-hSU2rapPW4b7pojlA&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=mHMrb_dVt7HOEAGtULwrbw&oh=00_AfbZiTdbOOn0h22moYW-9AEnjOX8ZUpj5vAc6ACFOO0rzw&oe=68D3D344",
    "https://scontent.fbsb20-1.fna.fbcdn.net/v/t39.30808-6/548196148_25822527847342514_13871215604472863_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=jp9IHq7Aqs0Q7kNvwFFBPgl&_nc_oc=AdmEQFAwhg_y76nUtXa1eL9M9ldvk5rnlgX3n7YdXMgPgdDNN5KLq74TG4ElA9Mmi4CVHql5MWYMCpiw6XJV2HGW&_nc_zt=23&_nc_ht=scontent.fbsb20-1.fna&_nc_gid=h9PcN3LlTShrkcznFqSIag&oh=00_AfbYzY-hNazy4fY6CkXnbjdRWLXr6Qkld_V6Mk9JSGutUA&oe=68D3CE9A"
  ]
};

const comments: Comment[] = [
  {
    id: 3,
    name: "Roberto Silva",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 6 meses e tô tirando em média R$680 por dia. Melhor decisão que tomei!",
    likes: 45,
    timeAgo: "3h",
    profileImage: profileImages.men[0]
  },
  {
    id: 4,
    name: "Mariana Costa",
    gender: "F",
    message: "Eu trabalho meio período porque tenho outro emprego, mas mesmo assim consigo uns R$350-400 por dia. Ótimo pra complementar a renda!",
    likes: 32,
    timeAgo: "4h",
    profileImage: profileImages.women[0]
  },
  {
    id: 5,
    name: "Diego Ferreira",
    gender: "M",
    message: "Alguém pode dizer se é muito difícil fazer as entregas?",
    likes: 8,
    timeAgo: "5h",
    profileImage: profileImages.men[1],
    replies: [
      {
        id: 6,
        name: "Lucas Oliveira",
        gender: "M",
        message: "Diego, cara, não é difícil não! O app da Shopee é bem fácil de usar, te guia pras entregas e tem suporte 24h. Você pega o jeito rápido, relaxa!",
        likes: 19,
        timeAgo: "4h",
        profileImage: profileImages.men[2],
        isReply: true
      }
    ]
  },
  {
    id: 7,
    name: "Fernando Santos",
    gender: "M",
    message: "Comecei semana passada e já estou fazendo R$520 por dia. O pessoal da Shopee é muito solicito, sempre ajudam quando preciso.",
    likes: 23,
    timeAgo: "6h",
    profileImage: profileImages.men[3]
  },
  {
    id: 1,
    name: "Carlos Mendes",
    gender: "M",
    message: "Gente, alguém pode explicar sobre essa cobrança do kit de EPI e cartão?",
    likes: 12,
    timeAgo: "2h",
    profileImage: profileImages.men[4],
    replies: [
      {
        id: 2,
        name: "Ana Paula Santos",
        gender: "F",
        message: "Carlos, essa cobrança é pra pagar a entrega dos EPIs e do cartão oficial da Shopee. Chega rapidinho, em 3-5 dias úteis. Vale muito a pena!",
        likes: 28,
        timeAgo: "1h",
        profileImage: profileImages.women[1],
        isReply: true
      }
    ]
  },
  {
    id: 8,
    name: "Patricia Lopes",
    gender: "F",
    message: "Recomendo demais! Trabalho de manhã no escritório e tarde faço entregas. Consegui comprar minha moto nova só com o dinheiro das entregas 😊",
    likes: 41,
    timeAgo: "7h",
    profileImage: profileImages.women[2]
  },
  {
    id: 9,
    name: "André Almeida",
    gender: "M",
    message: "Pessoal, tô conseguindo tirar uns R$750 por dia trabalhando das 7h as 19h. Vale muito a pena o investimento inicial!",
    likes: 37,
    timeAgo: "8h",
    profileImage: profileImages.men[5]
  },
  {
    id: 10,
    name: "João Pedro",
    gender: "M",
    message: "Trabalho como entregador da Shopee há 1 ano. Já consegui pagar todas minhas dívidas e ainda sobra dinheiro. Mudou minha vida!",
    likes: 56,
    timeAgo: "9h",
    profileImage: profileImages.men[6]
  },
  {
    id: 11,
    name: "Juliana Rocha",
    gender: "F",
    message: "Faço entregas só nos fins de semana e consigo uns R$400-500 por dia. Perfeito pra quem quer uma renda extra!",
    likes: 29,
    timeAgo: "10h",
    profileImage: profileImages.women[3]
  },
  {
    id: 12,
    name: "Marcos Vieira",
    gender: "M",
    message: "Melhor coisa que fiz foi me cadastrar na Shopee. Tô ganhando bem mais do que no meu emprego anterior. Média de R$620 por dia.",
    likes: 44,
    timeAgo: "11h",
    profileImage: profileImages.men[7]
  },
  {
    id: 13,
    name: "Ricardo Nunes",
    gender: "M",
    message: "Galera, o suporte da Shopee é excelente. Sempre que tenho alguma dúvida eles respondem super rápido no whatsapp.",
    likes: 18,
    timeAgo: "12h",
    profileImage: profileImages.men[8]
  },
  {
    id: 14,
    name: "Thiago Barbosa",
    gender: "M",
    message: "Trabalho das 8h às 17h e consigo fazer uns R$580 por dia. O bom é que você escolhe seus horários, tem flexibilidade total.",
    likes: 35,
    timeAgo: "13h",
    profileImage: profileImages.men[8]
  },
  {
    id: 15,
    name: "Camila Torres",
    gender: "F",
    message: "Comecei há 2 meses e já consegui juntar uma boa grana. O investimento no kit se paga rapidinho, vale muito a pena mesmo!",
    likes: 26,
    timeAgo: "14h",
    profileImage: profileImages.women[4]
  },
  {
    id: 16,
    name: "Rafael Lima",
    gender: "M",
    message: "Cara, eu era cético no começo mas depois de 3 meses fazendo entregas posso dizer: melhor investimento da minha vida. Tiro uns R$700 por dia tranquilo.",
    likes: 42,
    timeAgo: "15h",
    profileImage: profileImages.men[10]
  },
  {
    id: 17,
    name: "Eduardo Matos",
    gender: "M",
    message: "A plataforma da Shopee é muito organizada. Você sabe exatamente quanto vai receber por cada entrega, sem surpresas.",
    likes: 21,
    timeAgo: "16h",
    profileImage: profileImages.men[11]
  },
  {
    id: 18,
    name: "Gustavo Pereira",
    gender: "M",
    message: "Pessoal, trabalho meio período e consigo R$420 por dia. Perfeito pra quem precisa de horário flexivel.",
    likes: 31,
    timeAgo: "17h",
    profileImage: profileImages.men[12]
  },
  {
    id: 19,
    name: "Bruno Costa",
    gender: "M",
    message: "Fiz o cadastro mês passado e já estou fazendo uma média de R$640 por dia. O treinamento online é muito bom, ensina tudo direitinho.",
    likes: 38,
    timeAgo: "18h",
    profileImage: profileImages.men[12]
  },
  {
    id: 20,
    name: "Daniela Martins",
    gender: "F",
    message: "Trabalho de segunda a sexta, meio período, e consigo uma renda extra muito boa. Recomendo pra todas as mulheres que querem independencia financeira!",
    likes: 47,
    timeAgo: "19h",
    profileImage: profileImages.women[0]
  },
  {
    id: 21,
    name: "Alexandre Santos",
    gender: "M",
    message: "O que mais gosto é a liberdade de escolher meus horários. Trabalho quando quero e ganho em média R$580 por dia. Top demais!",
    likes: 33,
    timeAgo: "20h",
    profileImage: profileImages.men[14]
  },
  {
    id: 22,
    name: "Vinicius Alves",
    gender: "M",
    message: "Pessoal, sobre o cartão de crédito com limite de R$ 1.900, ele realmente funciona em todos os lugares?",
    likes: 15,
    timeAgo: "21h",
    profileImage: profileImages.men[0],
    replies: [
      {
        id: 23,
        name: "Rodrigo Mendonça",
        gender: "M",
        message: "Vinicius, cara, o cartão passa em tudo mesmo! Uso em mercado, posto, loja, farmácia... E o melhor é que o limite vai aumentando conforme você trabalha. O meu começou com R$ 1.900 e hoje, depois de 3 meses fazendo entregas, já tá em R$ 5.000! Vale demais a pena!",
        likes: 52,
        timeAgo: "20h",
        profileImage: profileImages.men[1],
        isReply: true
      }
    ]
  }
];

function CommentsSection() {
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  const toggleLike = (commentId: number) => {
    const newLiked = new Set(likedComments);
    if (newLiked.has(commentId)) {
      newLiked.delete(commentId);
    } else {
      newLiked.add(commentId);
    }
    setLikedComments(newLiked);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-4' : 'mb-8'} ${isReply ? 'bg-gray-50 rounded-lg p-3' : ''}`}>
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
          <img 
            src={comment.profileImage} 
            alt={`${comment.name} profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">' + comment.name.charAt(0) + '</div>';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">{comment.name}</span>
            <span className="text-xs text-gray-500">{comment.timeAgo}</span>
          </div>
          <p className="text-sm text-gray-800 mb-2 leading-relaxed">
            {comment.message}
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleLike(comment.id)}
              className={`flex items-center gap-1 text-xs ${likedComments.has(comment.id) ? 'text-red-600' : 'text-gray-500'} hover:text-red-600 transition-colors`}
            >
              <Heart className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
              {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
            </button>
            {comment.replies && comment.replies.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageCircle className="w-4 h-4" />
                {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}
              </span>
            )}
          </div>
          {comment.replies && (
            <div className="mt-4">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-8 h-8 text-orange-500" />
        <span className="text-lg font-semibold text-gray-900">Comentários dos Entregadores</span>
      </div>
      
      <div className="space-y-4">
        {comments.map(comment => renderComment(comment))}
      </div>
    </div>
  );
}

export default CommentsSection;