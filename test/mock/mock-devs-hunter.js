var DevsHunter = require('../../build/handlers/utils/devs_hunter_handler')
var simple = require('simple-mock');

var mockGetAndroidApp = function() {
    simple.mock(DevsHunter, "getAndroidApp", function() {
        return {
            name: 'Test App',
            category: '/store/apps/category/ENTERTAINMENT',
            icon: 'https://lh5.ggpht.com/vrsl2YRVDaz1Icm6dmd4zrdDisvmNfjYD6fF7-sUVus_W7RsKWVPyuRqxKRezEY5hGfF=w300',
            isFree: true,
            package: 'com.example.test',
            description: 'Test',
            url: 'https://play.google.com/store/apps/details?id=com.koli',
            developer: {
                name: "test",
                email: "test@test.com"
            },
            screenshots: [
                "https://lh5.ggpht.com/4cQ9dADa7rTIfcriPPRxhakNZSw5Y5LmZ9z-VlGgEDEKRAInn3-9lti_DuNAP773_ak=h310",
                "https://lh4.ggpht.com/bpOowZFOigkjfr7BxcIArIVhx-lzaDnbd1g8RMMR0c1I6yp_BcLqltUWB7Rs89g4GtY=h310",
                "https://lh3.ggpht.com/-mSDhonWrecxej3jnvqnCYHamsQKZx-9kaEofqVExKeDNhd8PkH3ejspYyDpoLGdYAI=h310",
                "https://lh5.ggpht.com/VRBHn6V-UPSTXIwM_lcD1OFG5AWSKxUZdeRBp7yC8xEgAd-wKzm1KitlkWvcYlu0CN8=h310",
                "https://lh6.ggpht.com/akXVx2fMB5RHIJ10-mMsdtDDLhdpg0B-eeABz1H3Wcq1thXX38ZVfRaQWJeeMzoEUGw=h310",
                "https://lh4.ggpht.com/mYRF2s92VEmR2WhxvQxc0Nzdw-nu_AvAimqswETYFCc8vY_7JRekly-quuBfHKyxQO5K=h310",
                "https://lh6.ggpht.com/bPVt-37okpmwfDY37xCUAABim3XUn2qN_MaHON48dkMFQtQK3H30tw5qIiytp-_wKNu1=h310",
                "https://lh3.ggpht.com/ja3Kgo55Us_xGOdx7WBT2J2L8nJo8dRFfYWhBIjalZTw3YEW7D8z5lWFJlUmkMbC6Q=h310",
                "https://lh3.ggpht.com/AVEErVUleoP3NXmgbyX86C8iIyP9O3CoNEfJgw6G4MZXv4Uw3x86RuJp4xK3KV0irA=h310",
                "https://lh5.ggpht.com/QjR9VSwlNU8hfT79hzuBGMR3ntQk7nJRNoaM2pCvQxwMLIHxfECabry4_Slikv9KtXY=h310",
                "https://lh5.ggpht.com/Od71ETuoZlGsqKbmqj0Q-ZwiS0z7Ny9DgwD_vER2SzCvX0o3IReGSvg-fQ7Li9j3wO4=h310",
                "https://lh6.ggpht.com/wFWAU48dbO2vIK5875vy0DhpCN9jZK_hi9XethjxPRDP-snxT2bPmniDX6EX0_4g9w=h310",
                "https://lh6.ggpht.com/kwa79_IOUXi8Wxy6_TwZXio-h1N7I1anOHfJ118No2DKRmfb7He7Hi-B_-oo8ftOtASO=h310",
                "https://lh6.ggpht.com/9GUf4ullIthdMCw2AvrbtprX_IJYLER3bTeSQx4Bv1lGX7NkIKMj6HRuFev_g9qdK54=h310",
                "https://lh5.ggpht.com/2kDd4AotVKyNgR3eBGV1g3IjR6Y-GKPeh0bhdaKXpka6N5Zh5aXJPbpEiKIP_0XoSw=h310"
            ],
            score: {
                oneStars: 136,
                twoStars: 66,
                threeStars: 127,
                fourStars: 317,
                fiveStars: 1053,
                count: 1699,
                total: 4.22
            }
        }
    })
}

module.exports.mockGetAndroidApp = mockGetAndroidApp

