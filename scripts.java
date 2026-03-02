public class ejemplose {


     public static void main(String[] args) {
       
        //ej 1


        String texto;                   //String texto
        texto = "Hola Mundo";           //texto = "Hola mundo"
        System.out.println(texto);      //println(texto)






        //ej 8
                                            //int i = 0
        int contador = 0;                   //int contador = 0


        for (int i = 1; i <= 10; i++) {     // repetir (i = i + 1)                 
                                               mientras (i <11)
            if (i > 5) {                    //if (i > 5)
                contador++;                 // contador = contador + 1
            }
        }                    


        System.out.println("[!] Del 1 al 10 hay " + contador + " numeros mayores que 5");


        //ej 9


        int edad = 19;                                          //int edad = 19
        if (edad >= 18) {                                       //if (edad > 18)
            System.out.println("[!] Eres mayor de edad");    // println("mayor de edad")
        } else {                                               //else
            System.out.println("[!] Eres menor de edad");   // println("menor de edad")
        }


        //ej 6


        int a = 12, suma = 0;                       // int a = 0, int suma=0
       
        if (a > 10) {                                 // if (a > 10)            
            System.out.println(a+" es mayor que 10"); //println(a)
        }                                             //println ("es mayor que 10")




        for (a = 1; a <= 10; a++) {                     // repetir (a = a + 1) mientras (a < 11)
            suma = suma + a;                            // suma = suma + a
        }




        System.out.println("Suma: "+suma);              //println(suma)




        //ej 4
                                                    //int a = 0
         for (int a = 0; a < 5; a++) {              //repetir (a = a + 1) mientras (a < 6)
         System.out.print("Hola.");               //println("Hola")
        }


        //ej 5


        int contador =0;                            //int contador = 0
        while (contador <10) {                      //repetir (contador = contador + 1) mientras (contador < 11)
        contador ++;                                    
        System.out.println(contador)}                   //prinln(contador)




        //ej 2


        int numero;                 //int numero
        numero = 3;                 //numero = 3
        System.out.print(numero);   //prinln(numero)


        //ej3


        int resultado;                  //int resultado
        resultado = 3 + 5;              //resultado = 3 + 5
        System.out.println(resultado);  //println(resultado)




    }


}
